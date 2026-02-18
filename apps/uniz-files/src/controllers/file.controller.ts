import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary (ensure env vars are set: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();

// --- Templates --- (No changes)

import axios from "axios";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3000/api/v1";

export const downloadAttendanceTemplate = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { branch, year, semester, subjectCode } = req.query;

    let rows = [];

    // If criteria provided, try to fetch students and pre-fill
    if (
      branch &&
      year &&
      semester &&
      subjectCode &&
      req.headers.authorization
    ) {
      try {
        // Fetch students from User Service (Inter-service call)
        const response = await axios.post(
          `${GATEWAY_URL}/profile/student/search`,
          {
            branch,
            year,
            limit: 1000, // Get all
          },
          {
            headers: { Authorization: req.headers.authorization },
          },
        );

        if (response.data.success && response.data.students) {
          rows = response.data.students.map((s: any) => [
            s.username,
            String(subjectCode).toUpperCase(),
            String(semester).toUpperCase(),
            "", // Attended (Blank)
            "", // Total (Blank)
          ]);
        }
      } catch (e) {
        console.warn("Failed to fetch students for template pre-fill", e);
      }
    }

    // Define headers
    const headers = [
      [
        "Student ID",
        "Subject Code",
        "Semester",
        "Attended Classes",
        "Total Classes",
      ],
    ];
    const data =
      rows.length > 0
        ? [...headers, ...rows]
        : [
            ...headers,
            ["O210001", "E1-SEM-1-CSE-1", "SEM-1", 25, 30], // Example if no data found
          ];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Template");

    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };

    // Auto-width columns
    worksheet.columns = [
      { width: 15 },
      { width: 25 },
      { width: 15 },
      { width: 20 },
      { width: 20 },
    ];

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Attendance_Template.xlsx"',
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const downloadGradesTemplate = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { branch, year, semester, subjectCode } = req.query;

    let rows = [];

    // If criteria provided, fetch students
    if (
      branch &&
      year &&
      semester &&
      subjectCode &&
      req.headers.authorization
    ) {
      try {
        const response = await axios.post(
          `${GATEWAY_URL}/profile/student/search`,
          {
            branch,
            year,
            limit: 1000,
          },
          {
            headers: { Authorization: req.headers.authorization },
          },
        );

        if (response.data.success && response.data.students) {
          rows = response.data.students.map((s: any) => [
            s.username,
            String(subjectCode).toUpperCase(),
            String(semester).toUpperCase(),
            "", // Grade (Blank)
          ]);
        }
      } catch (e) {
        console.warn("Failed to fetch students for template pre-fill", e);
      }
    }

    const headers = [["Student ID", "Subject Code", "Semester", "Grade"]];
    const data =
      rows.length > 0
        ? [...headers, ...rows]
        : [...headers, ["O210001", "E1-SEM-1-CSE-1", "SEM-1", 9]];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Grades Template");

    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };

    // Auto-width
    worksheet.columns = [
      { width: 15 },
      { width: 25 },
      { width: 15 },
      { width: 10 },
    ];

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Grades_Template.xlsx"',
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// --- Helper: Upload Buffer to Cloudinary (Optional usage) ---
const uploadToCloudinary = (buffer: Buffer, filename: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) return resolve(null); // Skip if not configured
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: `uploads/${filename}_${Date.now()}`,
        format: "xlsx",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    uploadStream.end(buffer);
  });
};

// --- Batch Uploads ---

export const uploadAttendance = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });

  try {
    // Optional: Save file copy to Cloudinary for audit
    try {
      await uploadToCloudinary(req.file.buffer, "attendance_log");
    } catch (e) {
      console.warn("Cloudinary upload failed (non-critical):", e);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer as any);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet)
      return res.status(400).json({ success: false, message: "Empty file" });

    const data: any[] = [];
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell) => {
      headers.push(String(cell.value).trim());
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        rowData[headers[colNumber - 1]] = cell.value;
      });
      data.push(rowData);
    });

    let successCount = 0;
    let failCount = 0;
    const errors: any[] = [];
    const updates: any[] = [];

    // 1. Pre-fetch relevant subjects in one query to avoid N+1 DB calls
    const subjectCodes = [
      ...new Set(
        data
          .map((row) => String(row["Subject Code"]).toUpperCase())
          .filter((c) => c),
      ),
    ];
    const subjects = await prisma.subject.findMany({
      where: { code: { in: subjectCodes } },
    });
    const subjectMap = new Map(subjects.map((s) => [s.code, s.id]));

    // 2. Prepare Operations
    for (const row of data) {
      const studentId = String(row["Student ID"] || "").toUpperCase();
      const subjectCode = String(row["Subject Code"] || "").toUpperCase();
      const semester = row["Semester"];
      const attended = Number(row["Attended Classes"]);
      const total = Number(row["Total Classes"]);

      if (!studentId || !subjectCode || !semester || isNaN(attended)) {
        failCount++;
        continue;
      }
      if (!subjectMap.has(subjectCode)) {
        errors.push(`Subject code not found: ${subjectCode}`);
        failCount++;
        continue;
      }

      const subjectId = subjectMap.get(subjectCode);
      updates.push(
        prisma.attendance.upsert({
          where: {
            studentId_subjectId_semesterId: {
              studentId,
              subjectId: subjectId!,
              semesterId: semester,
            },
          },
          update: { attendedClasses: attended, totalClasses: total },
          create: {
            studentId,
            subjectId: subjectId!,
            semesterId: semester,
            attendedClasses: attended,
            totalClasses: total,
          },
        }),
      );
    }

    // 3. Execute Transaction
    if (updates.length > 0) {
      // Prisma transactions handle batching efficiently
      // If huge (>5000), consider breaking into chunks of 1000
      const chunkSize = 500;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const batch = updates.slice(i, i + chunkSize);
        await prisma.$transaction(batch);
        successCount += batch.length;
      }
    }

    return res.json({
      success: true,
      processed: data.length,
      successCount,
      failCount,
      errors: errors.slice(0, 50),
    }); // Limit error log
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const uploadGrades = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });

  try {
    try {
      await uploadToCloudinary(req.file.buffer, "grades_log");
    } catch (e) {
      console.warn("Cloudinary upload failed (non-critical):", e);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer as any);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet)
      return res.status(400).json({ success: false, message: "Empty file" });

    const data: any[] = [];
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell) => {
      headers.push(String(cell.value).trim());
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        rowData[headers[colNumber - 1]] = cell.value;
      });
      data.push(rowData);
    });

    let successCount = 0;
    let failCount = 0;
    const errors: any[] = [];
    const updates: any[] = [];

    // 1. Pre-fetch relevant subjects
    const subjectCodes = [
      ...new Set(
        data
          .map((row) => String(row["Subject Code"]).toUpperCase())
          .filter((c) => c),
      ),
    ];
    const subjects = await prisma.subject.findMany({
      where: { code: { in: subjectCodes } },
    });
    const subjectMap = new Map(subjects.map((s) => [s.code, s.id]));

    // 2. Prepare Operations
    for (const row of data) {
      const studentId = String(row["Student ID"] || "").toUpperCase();
      const subjectCode = String(row["Subject Code"] || "").toUpperCase();
      const semester = row["Semester"];
      const grade = Number(row["Grade"]);

      if (!studentId || !subjectCode || !semester || isNaN(grade)) {
        failCount++;
        continue;
      }
      if (!subjectMap.has(subjectCode)) {
        errors.push(`Subject code not found: ${subjectCode}`);
        failCount++;
        continue;
      }

      const subjectId = subjectMap.get(subjectCode);
      updates.push(
        prisma.grade.upsert({
          where: {
            studentId_subjectId_semesterId: {
              studentId,
              subjectId: subjectId!,
              semesterId: semester,
            },
          },
          update: { grade },
          create: {
            studentId,
            subjectId: subjectId!,
            semesterId: semester,
            grade,
          },
        }),
      );
    }

    // 3. Execute Transaction
    if (updates.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const batch = updates.slice(i, i + chunkSize);
        await prisma.$transaction(batch);
        successCount += batch.length;
      }
    }

    return res.json({
      success: true,
      processed: data.length,
      successCount,
      failCount,
      errors: errors.slice(0, 50),
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
