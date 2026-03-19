import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import ExcelJS from "exceljs";
import prisma from "../utils/prisma.util";
import axios from "axios";

const GATEWAY_URL = (
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-gateway-api:3000/api/v1"
    : process.env.GATEWAY_URL) || "http://localhost:3000/api/v1"
).replace(/\/$/, "");

const getHeaders = (token: string) => ({ headers: { Authorization: token } });

/**
 * @desc Generate Seating Template based on Batch, Year, Semester
 */
export const getSeatingTemplate = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { semesterId, branch, year, examName = "MID-1" } = req.query;

  if (!semesterId) {
    return res.status(400).json({ error: "semesterId is required" });
  }

  try {
    const semester = await prisma.academicSemester.findUnique({
      where: { id: semesterId as string },
    });

    if (!semester) {
      return res.status(404).json({ error: "Semester not found" });
    }

    // 1. Fetch Students in specified Branch/Year
    // If not provided, we might fetch all registered for this semester
    let studentIds: string[] = [];
    let studentProfiles: any[] = [];

    const searchParams: any = {
      limit: 2000, // Batch limit
    };
    if (branch) searchParams.branch = branch;
    if (year) searchParams.year = year;

    try {
      const profilesRes = await axios.post(
        `${GATEWAY_URL}/profile/student/search`,
        searchParams,
        {
          ...getHeaders(req.headers.authorization || ""),
          timeout: 5000,
        },
      );
      studentProfiles = profilesRes.data.students || [];
      studentIds = studentProfiles.map((p: any) => p.username);
    } catch (err) {
      console.error("[Seating] Failed to fetch student profiles:", err);
    }

    // 2. Fetch Registrations for these students in this semester
    const registrations = await prisma.registration.findMany({
      where: {
        semesterId: semesterId as string,
        studentId: { in: studentIds },
      },
      include: {
        subject: true,
      },
    });

    // 3. Generate Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Seating Template");

    worksheet.columns = [
      { header: "Student ID", key: "studentId", width: 15 },
      { header: "Student Name", key: "studentName", width: 25 },
      { header: "Branch", key: "branch", width: 10 },
      { header: "Year", key: "year", width: 10 },
      { header: "Subject Code", key: "subjectCode", width: 15 },
      { header: "Subject Name", key: "subjectName", width: 25 },
      { header: "Exam Name", key: "examName", width: 15 },
      { header: "Exam Date (YYYY-MM-DD)", key: "date", width: 22 },
      { header: "Exam Time", key: "time", width: 20 },
      { header: "Room", key: "room", width: 15 },
      { header: "Seat Number", key: "seatNumber", width: 15 },
    ];

    const profileMap = new Map(studentProfiles.map((p: any) => [p.username, p]));

    registrations.forEach((reg: any) => {
      const profile = profileMap.get(reg.studentId);
      worksheet.addRow({
        studentId: reg.studentId,
        studentName: profile?.name || "",
        branch: profile?.branch || "",
        year: profile?.year || "",
        subjectCode: reg.subject.code,
        subjectName: reg.subject.name,
        examName: examName,
        date: "",
        time: "",
        room: "",
        seatNumber: "",
      });
    });

    // Styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEEEEEE" },
    };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=SeatingTemplate_${branch || "All"}_${year || ""}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("[Seating Template Error]:", error);
    res.status(500).json({ error: "Failed to generate template" });
  }
};

/**
 * @desc Upload Seating Arrangement
 */
export const uploadSeating = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const { semesterId } = req.body;
  if (!semesterId) {
    return res.status(400).json({ error: "semesterId is required" });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return res.status(400).json({ error: "Invalid worksheet" });
    }

    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const data = {
        studentId: row.getCell(1).text?.toString().trim(),
        subjectCode: row.getCell(5).text?.toString().trim(),
        examName: row.getCell(7).text?.toString().trim(),
        date: row.getCell(8).text?.toString().trim(),
        time: row.getCell(9).text?.toString().trim(),
        room: row.getCell(10).text?.toString().trim(),
        seatNumber: row.getCell(11).text?.toString().trim(),
      };

      if (data.studentId && data.subjectCode && data.examName && data.room) {
        rows.push(data);
      }
    });

    if (rows.length === 0) {
      return res.status(400).json({ error: "No valid data found in file" });
    }

    // Process rows
    // To be efficient, we'll fetch all subject IDs first
    const subjectCodes = [...new Set(rows.map((r) => r.subjectCode))];
    const subjects = await prisma.subject.findMany({
      where: { code: { in: subjectCodes } },
      select: { id: true, code: true },
    });
    const subMap = new Map<string, string>(subjects.map((s: any) => [s.code, s.id]));

    let count = 0;
    for (const row of rows) {
      const subjectId = subMap.get(row.subjectCode);
      if (!subjectId) continue;

      let parsedDate = null;
      if (row.date) {
        const d = new Date(row.date);
        if (!isNaN(d.getTime())) parsedDate = d;
      }

      await prisma.seatingArrangement.upsert({
        where: {
          studentId_subjectId_semesterId_examName: {
            studentId: row.studentId,
            subjectId,
            semesterId,
            examName: row.examName,
          },
        },
        update: {
          room: row.room,
          seatNumber: row.seatNumber,
          date: parsedDate,
          time: row.time,
          updatedAt: new Date(),
        },
        create: {
          studentId: row.studentId,
          subjectId,
          semesterId,
          examName: row.examName,
          room: row.room,
          seatNumber: row.seatNumber,
          date: parsedDate,
          time: row.time,
        },
      });
      count++;
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${count} arrangements`,
    });
  } catch (error) {
    console.error("[Seating Upload Error]:", error);
    res.status(500).json({ error: "Failed to upload seating arrangement" });
  }
};

/**
 * @desc Get Seating for Current Student
 */
export const getStudentSeating = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    // 1. Get current active semester
    const activeSem = await prisma.academicSemester.findFirst({
      where: {
        status: {
          in: ["REGISTRATION_OPEN", "REGISTRATION_CLOSED", "APPROVED"],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeSem) {
      return res.json({ seating: [] });
    }

    const seating = await prisma.seatingArrangement.findMany({
      where: {
        studentId: user.username,
        semesterId: activeSem.id,
      },
      include: {
        subject: true,
      },
      orderBy: { date: "asc" },
    });

    res.json({
      semester: activeSem,
      seating: seating.map((s: any) => ({
        id: s.id,
        subjectName: s.subject.name,
        subjectCode: s.subject.code,
        examName: s.examName,
        room: s.room,
        seatNumber: s.seatNumber,
        date: s.date,
        time: s.time,
      })),
    });
  } catch (error) {
    console.error("[Get Seating Error]:", error);
    res.status(500).json({ error: "Failed to fetch seating arrangement" });
  }
};
