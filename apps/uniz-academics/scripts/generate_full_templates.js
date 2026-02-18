const XLSX = require("xlsx");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

async function generate() {
  const userPrisma = new PrismaClient({
    datasourceUrl:
      "postgresql://neondb_owner:npg_BP1it9EkDRGs@ep-red-queen-a12hqixj-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&schema=users",
  });
  const academicPrisma = new PrismaClient({
    datasourceUrl:
      "postgresql://neondb_owner:npg_BP1it9EkDRGs@ep-red-queen-a12hqixj-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&schema=academics",
  });

  try {
    const students = await userPrisma.studentProfile.findMany({
      where: { branch: "CSE", year: "E2" },
      select: { username: true, name: true },
    });

    const subjects = await academicPrisma.subject.findMany({
      where: {
        department: "CSE",
        semester: "SEM-1",
        code: { startsWith: "E2" },
      },
    });

    console.log(
      `Found ${students.length} students and ${subjects.length} subjects.`,
    );

    const gradeHeaders = [
      [
        "Student ID",
        "Student Name",
        "Subject Code",
        "Subject Name",
        "Semester ID",
        "Grade (EX, A, B, C, D, E, R)",
      ],
    ];
    const attHeaders = [
      [
        "Student ID",
        "Student Name",
        "Subject Code",
        "Subject Name",
        "Semester ID",
        "Total Classes Occurred",
        "Total Classes Attended",
      ],
    ];

    students.forEach((s) => {
      subjects.forEach((sub) => {
        gradeHeaders.push([
          s.username,
          s.name,
          sub.code,
          sub.name,
          "SEM-1",
          "",
        ]);
        attHeaders.push([
          s.username,
          s.name,
          sub.code,
          sub.name,
          "SEM-1",
          "",
          "",
        ]);
      });
    });

    const wbGrades = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wbGrades,
      XLSX.utils.aoa_to_sheet(gradeHeaders),
      "Template",
    );
    fs.writeFileSync(
      "/Users/sreecharandesu/Projects/uniz-rguktong/tests/data/full_batch_grades.xlsx",
      XLSX.write(wbGrades, { type: "buffer", bookType: "xlsx" }),
    );

    const wbAtt = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wbAtt,
      XLSX.utils.aoa_to_sheet(attHeaders),
      "Template",
    );
    fs.writeFileSync(
      "/Users/sreecharandesu/Projects/uniz-rguktong/tests/data/full_batch_attendance.xlsx",
      XLSX.write(wbAtt, { type: "buffer", bookType: "xlsx" }),
    );

    console.log(
      "Successfully generated full batch files in /Users/sreecharandesu/Projects/uniz-rguktong/tests/data/",
    );
  } finally {
    await userPrisma.$disconnect();
    await academicPrisma.$disconnect();
  }
}

generate();
