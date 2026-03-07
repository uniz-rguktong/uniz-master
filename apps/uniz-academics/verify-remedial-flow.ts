import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { mapGradeToPoint } from "./src/utils/helpers.util";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function processExcel(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) return;

  const rows: any[] = [];
  const headers: string[] = [];
  worksheet.getRow(1).eachCell((cell) => {
    headers.push(String(cell.value).trim());
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowData: any = {};
    row.eachCell((cell, colNumber) => {
      rowData[headers[colNumber - 1]] = cell.value;
    });
    rows.push(rowData);
  });

  const allSubjects = await prisma.subject.findMany();
  const subjectMap = new Map(allSubjects.map((s) => [s.code, s]));

  console.log(`Processing ${rows.length} rows...`);

  for (const row of rows) {
    const studentId = String(row["Student ID"] || "")
      .toUpperCase()
      .trim();
    if (studentId !== "O210008") continue; // Only process the target student for test speed

    const code = String(row["Subject Code"] || "")
      .toUpperCase()
      .trim();
    const rawGrade = String(row["Grade (EX, A, B, C, D, E, R)"] || "").trim();
    const semesterId = String(row["Semester ID"] || "").trim();

    const subject = subjectMap.get(code);
    if (!subject) continue;

    const grade = mapGradeToPoint(rawGrade);
    const batchYear = studentId.substring(0, 3);

    const existingGrade = await prisma.grade.findUnique({
      where: {
        studentId_subjectId_semesterId: {
          studentId,
          subjectId: subject.id,
          semesterId,
        },
      },
    });

    let isRemedial = existingGrade?.isRemedial || false;
    if (existingGrade && existingGrade.grade === 0 && grade !== 0) {
      isRemedial = true;
      console.log(
        `[PASS] Student ${studentId} passed remedial for ${code}! Marking as isRemedial.`,
      );
    }

    await prisma.grade.upsert({
      where: {
        studentId_subjectId_semesterId: {
          studentId,
          subjectId: subject.id,
          semesterId,
        },
      },
      update: { grade, batch: batchYear, isRemedial, updatedAt: new Date() },
      create: {
        studentId,
        subjectId: subject.id,
        semesterId,
        grade,
        batch: batchYear,
        isRemedial,
      },
    });
  }
}

const filePath =
  "/Users/sreecharandesu/Projects/uniz-master/tests/data/grades_upload/O21_E4_SEM-2.xlsx";

processExcel(filePath)
  .then(() => console.log("Processing finished."))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
