import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import ExcelJS from "exceljs";
import axios from "axios";
import { UserRole } from "../shared/roles.enum";
import { redis } from "../utils/redis.util";
import { processNextStudentBatch } from "../services/bulk-worker.service";

const prisma = new PrismaClient();
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:3001";

const BRANCH_MAP: Record<string, string> = {
  "COMPUTER SCIENCE AND ENGINEERING": "CSE",
  "ELECTRONICS AND COMMUNICATION ENGINEERING": "ECE",
  "ELECTRICAL AND ELECTRONICS ENGINEERING": "EEE",
  "MECHANICAL ENGINEERING": "MECH",
  "CIVIL ENGINEERING": "CIVIL",
  "CHEMICAL ENGINEERING": "CHEM",
  "METALLURGICAL AND MATERIALS ENGINEERING": "MME",
  "METALLURGY AND MATERIALS ENGINEERING": "MME",
};

const mapBranch = (name: string) => {
  const upper = name.trim().toUpperCase();
  return BRANCH_MAP[upper] || upper;
};

// Helper for Excel generation
const generateExcel = async (
  headers: string[][],
  filename: string,
  res: Response,
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Template");

  headers.forEach((row) => {
    worksheet.addRow(row);
  });

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1A237E" }, // Deep Navy
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // Style data rows and set widths
  worksheet.columns.forEach((col: any, i) => {
    col.width = 20;
    col.alignment = { vertical: "middle", horizontal: "left" };
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename=${filename}.xlsx`);

  const buffer = await workbook.xlsx.writeBuffer();
  return res.send(buffer);
};

export const getStudentsTemplate = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  // Columns: Student ID, Name, Email, Gender (M/F), Branch, Year, Section, Phone
  const headers = [
    [
      "Student ID",
      "Name",
      "Email",
      "Gender",
      "Branch",
      "Year",
      "Section",
      "Phone",
      "Batch",
    ],
    [
      "O210000",
      "ExampleStudent",
      "o210000@rguktong.ac.in",
      "Male",
      "CSE",
      "E1",
      "A",
      "9876543210",
      "O21",
    ],
  ];
  return generateExcel(headers, "Student_Upload_Template", res);
};

export const getUploadProgress = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const key = `student:upload:progress:${user.username}`;
  const data = await redis.get(key);

  if (!data) {
    return res.json({
      status: "idle",
      message: "No active or recent student upload found.",
    });
  }

  return res.json(JSON.parse(data));
};

export const uploadStudents = async (req: any, res: Response) => {
  const user = req.user;
  if (!user || user.role !== UserRole.WEBMASTER) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: Access restricted to Webmaster only",
    });
  }

  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "Excel file required" });

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet)
      return res.status(400).json({ success: false, message: "Empty file" });

    const rows: any[] = [];
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell) => {
      headers.push(String(cell.value).toLowerCase().trim());
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowData: any = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] = cell.value;
        }
      });
      rows.push(rowData);
    });

    const total = rows.length;
    if (total === 0)
      return res.status(400).json({ success: false, message: "Empty file" });

    // Initialize progress in Redis
    await redis.setex(
      `student:upload:progress:${user.username}`,
      600,
      JSON.stringify({
        status: "processing",
        processed: 0,
        total,
        success: 0,
        fail: 0,
        percent: 0,
        etaSeconds: 0,
      }),
    );

    const startTime = Date.now();

    // 1. Upload the raw buffer to Cloudinary for historical backup (BACKGROUND)
    let cloudinaryUrl = null;
    const uploadToCloudinary = async (buffer: Buffer, filename: string) => {
      try {
        const FormData = require("form-data");
        const form = new FormData();
        form.append("file", buffer, filename);
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
        form.append("upload_preset", uploadPreset);

        const resUpload = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
          form,
          { headers: form.getHeaders() },
        );
        return resUpload.data.secure_url;
      } catch (cloudErr) {
        console.warn("Cloudinary student backup failed:", cloudErr);
        return null;
      }
    };

    // Fire and forget, we don't hold up the user for a backup
    uploadToCloudinary(req.file.buffer, req.file.originalname).then((url) => {
      cloudinaryUrl = url;
      // Update job if needed, but for now we just let it be
    });

    // 2. PRE-SCAN: Identify Majority Batch
    const prefixes: Record<string, number> = {};
    rows.forEach((row) => {
      const rowId = (
        Object.values(row).find((v) => /^[A-Z]\d{2,}/i.test(String(v || ""))) ||
        ""
      )
        .toString()
        .toUpperCase();
      if (rowId && rowId.length >= 3) {
        const prefix = rowId.substring(0, 3);
        if (/^[A-Z]\d{2}$/.test(prefix)) {
          prefixes[prefix] = (prefixes[prefix] || 0) + 1;
        }
      }
    });
    const majorityBatch =
      Object.keys(prefixes).sort((a, b) => prefixes[b] - prefixes[a])[0] || "";

    // 3. Create Job Payload
    const uploadId = require("crypto").randomUUID();
    const job = {
      uploadId,
      username: user.username,
      fileUrl: cloudinaryUrl,
      rows,
      total,
      majorityBatch,
      startTime: Date.now(),
    };

    // 4. Initialize progress in Redis
    await redis.setex(
      `student:upload:progress:${user.username}`,
      3600,
      JSON.stringify({
        status: "queued",
        processed: 0,
        total,
        success: 0,
        fail: 0,
        percent: 0,
        etaSeconds: 0,
      }),
    );

    // 5. Enqueue Job
    await redis.rpush("student:job:queue", JSON.stringify(job));

    // 6. Trigger Processing asynchronously via local endpoint (Reliable start without hanging)
    console.log(
      `[Bulk] Enqueued student upload ${uploadId}. Triggering background worker...`,
    );

    const port = process.env.PORT || 3002;
    const triggerUrl = `http://localhost:${port}/api/queue/process?lb_init=${Math.random().toString(36).substring(7)}`;

    axios
      .post(
        triggerUrl,
        {},
        {
          headers: {
            "x-internal-secret": process.env.INTERNAL_SECRET || "uniz-core",
          },
          timeout: 2000,
        },
      )
      .catch((e) => {
        console.error(
          `[Bulk] Failed to trigger initial student worker: ${e.message}`,
        );
      });

    return res.status(202).json({
      success: true,
      message: "Student bulk upload started in background.",
      total,
      monitor_url: "/api/v1/profile/admin/student/upload/progress",
    });
  } catch (e: any) {
    console.error("Upload Error:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * SELECTIVE STUDENT EXPORT
 * GET /api/v1/profile/admin/student/export
 * Query Params: branch, year, gender, section, fields (comma-separated list of fields)
 */
export const exportStudentsSelective = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { branch, year, gender, section, fields, batch } = req.query;

    // Build filter
    const where: any = {};
    if (branch) where.branch = String(branch).toUpperCase();
    if (year) where.year = String(year).toUpperCase();
    if (gender) where.gender = String(gender);
    if (section) where.section = String(section).toUpperCase();
    if (batch) where.batch = String(batch).toUpperCase();

    const students = await prisma.studentProfile.findMany({
      where,
      orderBy: { username: "asc" },
    });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found with the given filters",
      });
    }

    // Determine fields to export
    const availableFields = [
      "username",
      "name",
      "email",
      "gender",
      "phone",
      "branch",
      "year",
      "section",
      "batch",
      "roomno",
      "isPresentInCampus",
    ];
    let exportFields = fields
      ? String(fields)
          .split(",")
          .map((f) => f.trim())
      : availableFields;

    // Validate fields
    exportFields = exportFields.filter((f) => availableFields.includes(f));
    if (exportFields.length === 0) exportFields = availableFields;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Students");

    // Add Header
    const headerRow = exportFields.map((f) =>
      f
        .toUpperCase()
        .replace(/([A-Z])/g, " $1")
        .trim(),
    );
    const row = worksheet.addRow(headerRow);

    // Premium Styling
    row.font = { bold: true, color: { argb: "FFFFFF" } };
    row.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1A237E" }, // Deep Navy
    };
    row.alignment = { vertical: "middle", horizontal: "center" };
    row.height = 25;

    // Add Data
    students.forEach((s) => {
      const dataRow = exportFields.map((f) => (s as any)[f]);
      worksheet.addRow(dataRow);
    });

    // Auto-width columns
    worksheet.columns.forEach((col: any) => {
      col.width = 20;
      col.alignment = { vertical: "middle", horizontal: "left" };
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Students_Export_${Date.now()}.xlsx`,
    );

    const buffer = await workbook.xlsx.writeBuffer();
    return res.send(buffer);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET UPLOAD HISTORY
 * GET /api/v1/profile/admin/upload-history
 */
export const getUploadHistory = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const history = await prisma.uploadHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 50, // Last 50 uploads
    });
    return res.json({ success: true, history });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * RECORD EXTERNAL UPLOAD
 * Internal POST to record history from other services (Academics)
 */
export const recordExternalUpload = async (req: any, res: Response) => {
  const {
    type,
    filename,
    totalRows,
    successCount,
    failCount,
    errors,
    uploadedBy,
  } = req.body;

  // Basic API Key or internal check would be good here, but for now we trust inter-service or origin matches
  try {
    const history = await prisma.uploadHistory.create({
      data: {
        type,
        filename,
        totalRows,
        successCount,
        failCount,
        errors,
        uploadedBy: uploadedBy || "system",
        status:
          failCount === 0
            ? "COMPLETED"
            : successCount > 0
              ? "PARTIAL"
              : "FAILED",
      },
    });
    return res.json({ success: true, historyId: history.id });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
