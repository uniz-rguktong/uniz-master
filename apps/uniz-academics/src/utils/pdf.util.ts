import PDFDocument from "pdfkit";
import axios from "axios";
import fs from "fs";
import path from "path";

export interface ResultData {
  username: string;
  name: string;
  branch: string;
  campus: string;
  semesterId: string;
  resultType?: "REGULAR" | "REMEDIAL";
  attempts: {
    label: string;
    grades: {
      grade: number;
      isRemedial?: boolean;
      attemptNumber?: number;
      passDate?: Date | string | null;
      subject: {
        code: string;
        name: string;
        credits: number;
      };
    }[];
  }[];
}

export interface AttendanceData {
  username: string;
  name: string;
  branch: string;
  campus: string;
  semesterId: string;
  records: {
    attendedClasses: number;
    totalClasses: number;
    subject: {
      code: string;
      name: string;
    };
  }[];
}

const CACHE_DIR = "/tmp/uniz-cache";
const CACHE_PATH = path.join(CACHE_DIR, "university_logo.jpg");
let cachedLogo: Buffer | null = null;
const getLogo = async (): Promise<Buffer | null> => {
  if (cachedLogo) return cachedLogo;
  const logoUrl = process.env.INSTITUTION_LOGO_URL || "https://res.cloudinary.com/dy2fjgt46/image/upload/v1771604895/rguktongole_logo_kbpaui.jpg";

  try {
    const response = await axios.get(logoUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
      headers: {
        'User-Agent': 'UniZ-Core-Engine/1.0 (Enterprise PDF Generator)'
      }
    });
    cachedLogo = Buffer.from(response.data);
    console.log("[PDF] Logo fetched successfully, size:", cachedLogo.length);
    return cachedLogo;
  } catch (err) {
    console.error("[PDF] Failed to fetch logo:", err);
    return null;
  }
};

const PAGE_MARGIN = 40;

const createPdfBuffer = async (
  draw: (doc: InstanceType<typeof PDFDocument>) => Promise<void> | void,
): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: PAGE_MARGIN,
      compress: false,
    });
    const chunks: any[] = [];
    doc.on("data", (chunk: any) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err: Error) => reject(err));
    const execute = async () => {
      try {
        await draw(doc);
        doc.end();
      } catch (err) {
        reject(err);
      }
    };
    execute();
  });
};

// Premium Institutional Colors
const PRIMARY_MAROON = "#800000";
const SECONDARY_GRAY = "#444444";
const ACCENT_GOLD = "#B8860B";
const BORDER_LIGHT = "#E0E0E0";
const HEADER_TINT = "#FFF5F5";

// Helper to clean subject name from codes
const cleanSubjectName = (name: string) => {
  return name.replace(/\s*\([\w-]+\)$/, "").trim();
};

export const generateResultPdf = async (data: ResultData): Promise<Buffer> => {
  const { name, username, branch, semesterId, campus, resultType } = data;
  const isRegularReport = resultType === "REGULAR";
  const logo = await getLogo();
  const campusName =
    campus && campus !== "N/A" ? campus.toUpperCase() : "RGUKT";

  let totalCredits = 0;
  let earnedPoints = 0;
  // Calculate SGPA across all attempts? Usually only the latest attempts count for GPA if they replaced failures.
  // But for the report summary, we'll show the summary based on the "Regular" attempt or the "Latest" state.
  const flatGrades = data.attempts.flatMap(a => a.grades);
  
  // To keep it simple, we'll use the flat grades count for summary
  flatGrades.forEach((g) => {
    const credit = Number(g.subject.credits);
    if (credit > 0) {
      totalCredits += credit;
      earnedPoints += credit * Number(g.grade || 0);
    }
  });
  const sgpa =
    totalCredits > 0 ? (earnedPoints / totalCredits).toFixed(2) : "0.00";

  const getGradeLetter = (point: number) => {
    if (point >= 10) return "EX";
    if (point >= 9) return "A";
    if (point >= 8) return "B";
    if (point >= 7) return "C";
    if (point >= 6) return "D";
    if (point >= 5) return "E";
    return "R";
  };

  return createPdfBuffer(async (doc) => {
    const { width, height } = doc.page;
    const usableWidth = width - PAGE_MARGIN * 2;

    // 1. Double Border Frame
    doc
      .rect(15, 15, width - 30, height - 30)
      .lineWidth(1)
      .strokeColor(PRIMARY_MAROON)
      .stroke();
    doc
      .rect(20, 20, width - 40, height - 40)
      .lineWidth(0.5)
      .strokeColor(ACCENT_GOLD)
      .stroke();

    // 2. Header
    if (logo) {
      doc.image(logo, width / 2 - 35, 40, { width: 70 });
    }
    doc.y = 120; // Maintain consistent start regardless of logo

    doc
      .fillColor(PRIMARY_MAROON)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("RAJIV GANDHI UNIVERSITY OF KNOWLEDGE TECHNOLOGIES", {
        align: "center",
      });
    doc
      .fontSize(10)
      .fillColor(SECONDARY_GRAY)
      .text(`ANDHRA PRADESH - ${campusName} CAMPUS`, { align: "center" });
    doc.moveDown(0.2);
    doc
      .fontSize(7)
      .font("Helvetica-Oblique")
      .text("(Established under AP Act 18 of 2008)", { align: "center" });

    // 3. Document Title
    doc.moveDown(2);
    doc.rect(PAGE_MARGIN, doc.y, usableWidth, 24).fill(HEADER_TINT);
    doc
      .fillColor(PRIMARY_MAROON)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(
        `PROVISIONAL ${resultType === "REMEDIAL" ? "REMEDIAL" : "REGULAR"} REPORT`,
        PAGE_MARGIN,
        doc.y + 7,
        {
          align: "center",
        },
      );
    doc.moveDown(2);

    // 4. Information Grid
    const infoY = doc.y;
    const colWidth = usableWidth / 2;
    const drawInfo = (label: string, val: string, x: number, y: number) => {
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(SECONDARY_GRAY)
        .text(label, x, y);
      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor("#000000")
        .text(val, x + 85, y);
    };

    drawInfo("STUDENT ID:", username, PAGE_MARGIN, infoY);
    drawInfo(
      "STUDENT NAME:",
      name === username ? "--" : name.toUpperCase(),
      PAGE_MARGIN,
      infoY + 18,
    );
    drawInfo(
      "BRANCH:",
      branch === "N/A" ? "--" : branch.toUpperCase(),
      PAGE_MARGIN + colWidth,
      infoY,
    );
    drawInfo(
      "SEMESTER:",
      semesterId.toUpperCase(),
      PAGE_MARGIN + colWidth,
      infoY + 18,
    );

    doc.moveDown(3);

    // 5. Table(s)
    const tWidths = {
      name: usableWidth * 0.68,
      credits: usableWidth * 0.16,
      grade: usableWidth * 0.16,
    };

    for (const attempt of data.attempts) {
      doc.moveDown(1);
      doc.fillColor(PRIMARY_MAROON).font("Helvetica-Bold").fontSize(10).text(attempt.label, PAGE_MARGIN + 2);
      doc.moveDown(0.5);

      let tableY = doc.y;

      doc.rect(PAGE_MARGIN, tableY, usableWidth, 24).fill(PRIMARY_MAROON);
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8);
      doc.text("SUBJECT DESCRIPTION", PAGE_MARGIN + 10, tableY + 8);
      doc.text("CREDITS", PAGE_MARGIN + tWidths.name, tableY + 8, {
        width: tWidths.credits,
        align: "center",
      });
      doc.text("GRADE", PAGE_MARGIN + tWidths.name + tWidths.credits, tableY + 8, {
        width: tWidths.grade,
        align: "center",
      });

      tableY += 24;
      doc.fillColor("#000000").font("Helvetica").fontSize(9);

      attempt.grades.forEach((g: any, idx: number) => {
        const nameText = cleanSubjectName(g.subjectNameOverride || g.subject.name);
        const nameHeight = doc.heightOfString(nameText, {
          width: tWidths.name - 20,
        });
        const rowHeight = Math.max(24, nameHeight + 10);

        if (tableY + rowHeight > height - 120) {
          doc.addPage();
          tableY = PAGE_MARGIN;
          // Redraw header on new page if needed? Optional for brevity.
        }

        if (idx % 2 === 1)
          doc.rect(PAGE_MARGIN, tableY, usableWidth, rowHeight).fill("#FAFAFA");

        doc.fillColor("#000000");
        doc.text(
          nameText,
          PAGE_MARGIN + 10,
          tableY + (rowHeight / 2 - nameHeight / 2),
          { width: tWidths.name - 20 },
        );
        doc.text(
          g.subject.credits.toFixed(1),
          PAGE_MARGIN + tWidths.name,
          tableY + (rowHeight / 2 - 4),
          { width: tWidths.credits, align: "center" },
        );

        let gLetter = getGradeLetter(g.grade);
        // Only show (R) suffix on REMEDIAL reports, never on REGULAR
        if (!isRegularReport && (g.isRemedial || g.attemptNumber > 1) && gLetter !== "R") {
          gLetter += " (R)";
        }

        if (gLetter.includes("R")) doc.fillColor("#D32F2F");
        doc.font("Helvetica-Bold").text(
          gLetter,
          PAGE_MARGIN + tWidths.name + tWidths.credits,
          tableY + (rowHeight / 2 - 4.5),
          { width: tWidths.grade, align: "center" },
        );

        // Only show pass date on REMEDIAL reports
        if (!isRegularReport && g.passDate) {
          const dateStr = new Date(g.passDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
          doc
            .font("Helvetica")
            .fontSize(6)
            .fillColor(SECONDARY_GRAY)
            .text(
              dateStr,
              PAGE_MARGIN + tWidths.name + tWidths.credits,
              tableY + (rowHeight / 2 + 3.5),
              { width: tWidths.grade, align: "center" },
            );
        }
        doc.font("Helvetica").fontSize(9).fillColor("#000000");

        tableY += rowHeight;
      });
      doc.moveDown(1);
    }

    // 6. SGPA Summary
    doc.moveDown(3);
    const boxW = 160;
    const boxX = PAGE_MARGIN + usableWidth - boxW;
    const boxY = doc.y;

    doc
      .rect(boxX, boxY, boxW, 50)
      .lineWidth(1.5)
      .strokeColor(PRIMARY_MAROON)
      .stroke();
    doc.rect(boxX + 1, boxY + 1, boxW - 2, 20).fill(HEADER_TINT);
    doc
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .fillColor(PRIMARY_MAROON)
      .text("ACADEMIC PERFORMANCE", boxX + 10, boxY + 7);
    doc.fontSize(14).text(`SGPA: ${sgpa}`, boxX + 10, boxY + 28);

    // 7. Footer
    const footerY = height - 100;
    doc.fontSize(7.5).fillColor(SECONDARY_GRAY).font("Helvetica-Oblique");
    doc.text(
      "* EX: Excellent, A: Very Good, B: Good, C: Fair, D: Satisfactory, E: Pass, R: Remedial",
      PAGE_MARGIN,
      footerY,
    );
    doc.text(
      "* This is a provisional report. Please verify with official university records.",
      PAGE_MARGIN,
      footerY + 12,
    );

    doc.font("Helvetica-Bold").fontSize(10).fillColor(PRIMARY_MAROON);
    doc.text(
      "Controller of Examinations",
      PAGE_MARGIN + usableWidth - 180,
      footerY + 30,
      { width: 180, align: "center" },
    );
  });
};

export const generateAttendancePdf = async (
  data: AttendanceData,
): Promise<Buffer> => {
  const { name, username, branch, semesterId, records, campus } = data;
  const logo = await getLogo();
  const campusName =
    campus && campus !== "N/A" ? campus.toUpperCase() : "RGUKT";

  let totalAttended = 0;
  let totalClasses = 0;
  records.forEach((r) => {
    totalAttended += r.attendedClasses;
    totalClasses += r.totalClasses;
  });
  const overallPercent =
    totalClasses > 0
      ? ((totalAttended / totalClasses) * 100).toFixed(2)
      : "0.00";

  return createPdfBuffer(async (doc) => {
    const { width, height } = doc.page;
    const usableWidth = width - PAGE_MARGIN * 2;

    doc
      .rect(15, 15, width - 30, height - 30)
      .lineWidth(1)
      .strokeColor(PRIMARY_MAROON)
      .stroke();

    if (logo) {
      doc.image(logo, width / 2 - 35, 40, { width: 70 });
    }
    doc.y = 120;

    doc
      .fillColor(PRIMARY_MAROON)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("RAJIV GANDHI UNIVERSITY OF KNOWLEDGE TECHNOLOGIES", {
        align: "center",
      });
    doc
      .fontSize(10)
      .fillColor(SECONDARY_GRAY)
      .text(`${campusName} CAMPUS - STUDENT ATTENDANCE REPORT`, {
        align: "center",
      });
    doc.moveDown(2);

    // Info Bar
    doc
      .rect(PAGE_MARGIN, doc.y, usableWidth, 40)
      .lineWidth(0.5)
      .strokeColor(BORDER_LIGHT)
      .stroke();
    const infoY = doc.y + 10;
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(SECONDARY_GRAY)
      .text("ID / NAME:", PAGE_MARGIN + 12, infoY);
    doc
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text(
        `${username} / ${name === username ? "--" : name.toUpperCase()}`,
        PAGE_MARGIN + 80,
        infoY,
      );
    doc
      .font("Helvetica")
      .fillColor(SECONDARY_GRAY)
      .text("BRANCH / SEM:", PAGE_MARGIN + 12, infoY + 16);
    doc
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text(
        `${branch === "N/A" ? "--" : branch.toUpperCase()} / ${semesterId.toUpperCase()}`,
        PAGE_MARGIN + 100,
        infoY + 16,
      );

    doc.moveDown(3);

    const tWidths = {
      name: usableWidth * 0.65,
      count: usableWidth * 0.17,
      percent: usableWidth * 0.18,
    };
    let tableY = doc.y;

    doc.rect(PAGE_MARGIN, tableY, usableWidth, 26).fill(PRIMARY_MAROON);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8.5);
    doc.text("COURSE DESCRIPTION", PAGE_MARGIN + 12, tableY + 9);
    doc.text("CLASSES", PAGE_MARGIN + tWidths.name + 10, tableY + 9, {
      width: tWidths.count,
      align: "center",
    });
    doc.text(
      "PERCENT",
      PAGE_MARGIN + tWidths.name + tWidths.count,
      tableY + 9,
      { width: tWidths.percent, align: "center" },
    );

    tableY += 26;
    doc.fillColor("#000000").font("Helvetica").fontSize(9);

    records.forEach((r, idx) => {
      const nameText = cleanSubjectName(r.subject?.name || "N/A");
      const nameHeight = doc.heightOfString(nameText, {
        width: tWidths.name - 24,
      });
      const rowHeight = Math.max(24, nameHeight + 12);

      // Page break logic
      if (tableY + rowHeight > height - 100) {
        doc.addPage();
        tableY = PAGE_MARGIN;
      }

      if (idx % 2 === 1)
        doc.rect(PAGE_MARGIN, tableY, usableWidth, rowHeight).fill(HEADER_TINT);
      const percent =
        r.totalClasses > 0
          ? ((r.attendedClasses / r.totalClasses) * 100).toFixed(1)
          : "0.0";

      doc.fillColor("#000000");
      doc.text(
        nameText,
        PAGE_MARGIN + 12,
        tableY + (rowHeight / 2 - nameHeight / 2),
        { width: tWidths.name - 24 },
      );
      doc.text(
        `${r.attendedClasses} / ${r.totalClasses}`,
        PAGE_MARGIN + tWidths.name + 10,
        tableY + (rowHeight / 2 - 4.5),
        { width: tWidths.count, align: "center" },
      );

      const pVal = Number(percent);
      const pColor = pVal < 75 ? "#D32F2F" : pVal > 90 ? "#1B5E20" : "#000000";
      doc
        .fillColor(pColor)
        .font("Helvetica-Bold")
        .text(
          `${percent}%`,
          PAGE_MARGIN + tWidths.name + tWidths.count,
          tableY + (rowHeight / 2 - 4.5),
          { width: tWidths.percent, align: "center" },
        );
      doc.font("Helvetica");

      tableY += rowHeight;
      doc
        .moveTo(PAGE_MARGIN, tableY)
        .lineTo(PAGE_MARGIN + usableWidth, tableY)
        .lineWidth(0.2)
        .strokeColor(BORDER_LIGHT)
        .stroke();
    });

    // OVERALL Summary Refinement: Horizontal Space FIX
    doc.moveDown(4);
    const summW = 340;
    const summX = PAGE_MARGIN + usableWidth - summW;
    const summY = doc.y;

    doc
      .rect(summX, summY, summW, 40)
      .fill(Number(overallPercent) < 75 ? "#FFF2F2" : "#F2FFF2");
    doc
      .rect(summX, summY, summW, 40)
      .lineWidth(1.2)
      .strokeColor(PRIMARY_MAROON)
      .stroke();

    const oColor = Number(overallPercent) < 75 ? "#D32F2F" : "#1B5E20";

    // Using continued(true) to avoid text overlapping
    doc.fontSize(10.5).font("Helvetica-Bold").fillColor(PRIMARY_MAROON);
    doc.text("OVERALL SEMESTER ATTENDANCE: ", summX + 20, summY + 14, {
      continued: true,
    });
    doc.fillColor(oColor).text(`${overallPercent}%`);

    doc.moveDown(5);
    doc
      .fontSize(7.5)
      .fillColor(SECONDARY_GRAY)
      .font("Helvetica-Oblique")
      .text(
        "* A minimum of 75% attendance is required as per university regulations.",
        PAGE_MARGIN,
        height - 60,
      );
  });
};
