import PDFDocument from "pdfkit";

export interface ResultData {
  username: string;
  name: string;
  branch: string;
  campus: string;
  semesterId: string;
  grades: {
    grade: number;
    subject: {
      code: string;
      name: string;
      credits: number;
    };
  }[];
}

// --- PDF UTILS (pure Node, styled similar to HTML version) ---
const PAGE_MARGIN = 40;

const createPdfBuffer = async (
  draw: (doc: InstanceType<typeof PDFDocument>) => void,
): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN });
    const chunks: any[] = [];

    doc.on("data", (chunk: any) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err: Error) => reject(err));

    try {
      draw(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

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

export const generateResultPdf = async (data: ResultData): Promise<Buffer> => {
  const { name, username, branch, semesterId, grades, campus } = data;

  // Professional Colors
  const primaryColor = "#1A237E"; // Deep Navy
  const secondaryColor = "#424242"; // Charcoal
  const accentColor = "#B8860B"; // Dark Gold
  const borderColor = "#D1D1D1";
  const headerBg = "#F8F9FA";

  // Calculate GPA
  let totalCredits = 0;
  let earnedPoints = 0;
  grades.forEach((g) => {
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

  return createPdfBuffer((doc) => {
    const { width, height } = doc.page;
    const usableWidth = width - PAGE_MARGIN * 2;

    // 1. Page Border
    doc
      .rect(20, 20, width - 40, height - 40)
      .lineWidth(1.5)
      .strokeColor(primaryColor)
      .stroke();
    doc
      .rect(25, 25, width - 50, height - 50)
      .lineWidth(0.5)
      .strokeColor(accentColor)
      .stroke();

    // 2. Institutional Header
    doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(18);
    doc.text("RAJIV GANDHI UNIVERSITY OF KNOWLEDGE TECHNOLOGIES", {
      align: "center",
    });

    doc
      .fontSize(11)
      .fillColor(secondaryColor)
      .text(`ANDHRA PRADESH - ${campus.toUpperCase()} CAMPUS`, {
        align: "center",
      });
    doc.moveDown(0.2);
    doc
      .fontSize(8)
      .font("Helvetica-Oblique")
      .text("(Established under AP Act 18 of 2008)", { align: "center" });

    // 3. Title Section
    doc.moveDown(1.5);
    doc.rect(PAGE_MARGIN, doc.y, usableWidth, 25).fill(headerBg);
    doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(13);
    doc.text("PROVISIONAL SEMESTER GRADE REPORT", PAGE_MARGIN, doc.y + 7, {
      align: "center",
    });
    doc.moveDown(1);

    // 4. Student Info Section
    const infoY = doc.y;
    const labelWidth = 100;
    const valueWidth = usableWidth / 2 - labelWidth;

    const drawInfo = (label: string, value: string, x: number, y: number) => {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(secondaryColor)
        .text(label, x, y);
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#000000")
        .text(value, x + labelWidth, y);
    };

    drawInfo("STUDENT ID:", username, PAGE_MARGIN, infoY);
    drawInfo(
      "BRANCH:",
      branch.toUpperCase(),
      PAGE_MARGIN + usableWidth / 2,
      infoY,
    );
    drawInfo("STUDENT NAME:", name.toUpperCase(), PAGE_MARGIN, infoY + 18);
    drawInfo(
      "SEMESTER:",
      semesterId.toUpperCase(),
      PAGE_MARGIN + usableWidth / 2,
      infoY + 18,
    );

    doc.moveDown(2.5);

    // 5. Grades Table
    const tCol1 = usableWidth * 0.15; // Code
    const tCol2 = usableWidth * 0.55; // Name
    const tCol3 = usableWidth * 0.15; // Credits
    const tCol4 = usableWidth * 0.15; // Grade

    let tableY = doc.y;

    // Header
    doc.rect(PAGE_MARGIN, tableY, usableWidth, 30).fill(primaryColor);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
    doc.text("COURSE CODE", PAGE_MARGIN + 10, tableY + 10, { width: tCol1 });
    doc.text("SUBJECT DESCRIPTION", PAGE_MARGIN + tCol1 + 10, tableY + 10, {
      width: tCol2,
    });
    doc.text("CREDITS", PAGE_MARGIN + tCol1 + tCol2, tableY + 10, {
      width: tCol3,
      align: "center",
    });
    doc.text("GRADE", PAGE_MARGIN + tCol1 + tCol2 + tCol3, tableY + 10, {
      width: tCol4,
      align: "center",
    });

    tableY += 30;
    doc.fillColor("#000000").font("Helvetica").fontSize(9);

    // Body with Dynamic Height
    grades.forEach((g, idx) => {
      // Calculate height needed for subject name
      const nameHeight = doc.heightOfString(g.subject.name, {
        width: tCol2 - 20,
      });
      const rowHeight = Math.max(25, nameHeight + 12);

      // Page break check (simple)
      if (tableY + rowHeight > height - 120) {
        doc.addPage();
        tableY = PAGE_MARGIN;
        // (Simplified: in a real app you'd redraw headers)
      }

      if (idx % 2 === 1)
        doc.rect(PAGE_MARGIN, tableY, usableWidth, rowHeight).fill("#F4F6F7");

      doc.fillColor("#000000");
      doc.text(
        g.subject.code,
        PAGE_MARGIN + 10,
        tableY + (rowHeight / 2 - 4.5),
      );
      doc.text(
        g.subject.name,
        PAGE_MARGIN + tCol1 + 10,
        tableY + (rowHeight / 2 - nameHeight / 2),
        { width: tCol2 - 20 },
      );
      doc.text(
        g.subject.credits.toFixed(1),
        PAGE_MARGIN + tCol1 + tCol2,
        tableY + (rowHeight / 2 - 4.5),
        { width: tCol3, align: "center" },
      );
      doc
        .font("Helvetica-Bold")
        .text(
          getGradeLetter(g.grade),
          PAGE_MARGIN + tCol1 + tCol2 + tCol3,
          tableY + (rowHeight / 2 - 4.5),
          { width: tCol4, align: "center" },
        );
      doc.font("Helvetica");

      tableY += rowHeight;
      doc
        .moveTo(PAGE_MARGIN, tableY)
        .lineTo(PAGE_MARGIN + usableWidth, tableY)
        .lineWidth(0.3)
        .strokeColor(borderColor)
        .stroke();
    });

    // 6. Summary and SGPA
    doc.moveDown(1.5);
    const summX = PAGE_MARGIN + usableWidth - 180;
    const summY = tableY + 20;

    doc
      .rect(summX, summY, 180, 50)
      .lineWidth(1)
      .strokeColor(primaryColor)
      .stroke();
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("ACADEMIC PERFORMANCE", summX + 10, summY + 10);
    doc
      .fontSize(14)
      .fillColor(primaryColor)
      .text(`SGPA: ${sgpa}`, summX + 10, summY + 28);

    // 7. Official Footer
    const footerY = height - 100;
    doc
      .fontSize(8)
      .fillColor(secondaryColor)
      .font("Helvetica-Oblique")
      .text(
        "* EX: Excellent, A: Very Good, B: Good, C: Fair, D: Satisfactory, E: Pass, R: Remedial",
        PAGE_MARGIN,
        footerY,
      );
    doc.text(
      "* This is an automated provisional report. Please verify with official records.",
      PAGE_MARGIN,
      footerY + 12,
    );

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(primaryColor)
      .text(
        "Controller of Examinations",
        PAGE_MARGIN + usableWidth - 150,
        footerY + 30,
        { align: "center" },
      );
  });
};

export const generateAttendancePdf = async (
  data: AttendanceData,
): Promise<Buffer> => {
  const { name, username, branch, semesterId, records, campus } = data;

  const primaryColor = "#1B5E20"; // Dark Forest Green
  const secondaryColor = "#424242";
  const accentColor = "#66BB6A";

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

  return createPdfBuffer((doc) => {
    const { width, height } = doc.page;
    const usableWidth = width - PAGE_MARGIN * 2;

    // Border
    doc
      .rect(20, 20, width - 40, height - 40)
      .lineWidth(1.5)
      .strokeColor(primaryColor)
      .stroke();

    // Header
    doc
      .fillColor(primaryColor)
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("RAJIV GANDHI UNIVERSITY OF KNOWLEDGE TECHNOLOGIES", {
        align: "center",
      });
    doc
      .fontSize(11)
      .fillColor(secondaryColor)
      .text(`${campus.toUpperCase()} CAMPUS - STUDENT ATTENDANCE REPORT`, {
        align: "center",
      });
    doc.moveDown(1.5);

    // Student Info
    doc
      .fontSize(9)
      .font("Helvetica")
      .text("ID / NAME:", PAGE_MARGIN)
      .font("Helvetica-Bold")
      .text(`${username} / ${name.toUpperCase()}`, PAGE_MARGIN + 60, doc.y - 9);
    doc
      .font("Helvetica")
      .text("BRANCH / SEM:", PAGE_MARGIN)
      .font("Helvetica-Bold")
      .text(
        `${branch.toUpperCase()} / ${semesterId.toUpperCase()}`,
        PAGE_MARGIN + 75,
        doc.y - 9,
      );
    doc.moveDown(1);

    // Table
    let tableY = doc.y;
    const tCol1 = usableWidth * 0.6;
    const tCol2 = usableWidth * 0.2;
    const tCol3 = usableWidth * 0.2;

    doc.rect(PAGE_MARGIN, tableY, usableWidth, 25).fill(primaryColor);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
    doc.text("COURSE DESCRIPTION", PAGE_MARGIN + 10, tableY + 8, {
      width: tCol1,
    });
    doc.text("CLASSES", PAGE_MARGIN + tCol1, tableY + 8, {
      width: tCol2,
      align: "center",
    });
    doc.text("PERCENT", PAGE_MARGIN + tCol1 + tCol2, tableY + 8, {
      width: tCol3,
      align: "center",
    });

    tableY += 25;
    doc.fillColor("#000000").font("Helvetica").fontSize(9);

    records.forEach((r, idx) => {
      const nameHeight = doc.heightOfString(r.subject.name, {
        width: tCol1 - 20,
      });
      const rowHeight = Math.max(22, nameHeight + 10);

      if (idx % 2 === 1)
        doc.rect(PAGE_MARGIN, tableY, usableWidth, rowHeight).fill("#F1F8E9");
      const percent =
        r.totalClasses > 0
          ? ((r.attendedClasses / r.totalClasses) * 100).toFixed(1)
          : "0.0";

      doc.fillColor("#000000");
      doc.text(
        `${r.subject.name} (${r.subject.code})`,
        PAGE_MARGIN + 10,
        tableY + (rowHeight / 2 - nameHeight / 2),
        { width: tCol1 - 20 },
      );
      doc.text(
        `${r.attendedClasses} / ${r.totalClasses}`,
        PAGE_MARGIN + tCol1,
        tableY + (rowHeight / 2 - 4.5),
        { width: tCol2, align: "center" },
      );

      const pColor = Number(percent) < 75 ? "#D32F2F" : primaryColor;
      doc
        .fillColor(pColor)
        .font("Helvetica-Bold")
        .text(
          `${percent}%`,
          PAGE_MARGIN + tCol1 + tCol2,
          tableY + (rowHeight / 2 - 4.5),
          { width: tCol3, align: "center" },
        );
      doc.font("Helvetica");

      tableY += rowHeight;
      doc
        .moveTo(PAGE_MARGIN, tableY)
        .lineTo(PAGE_MARGIN + usableWidth, tableY)
        .lineWidth(0.2)
        .strokeColor("#BDBDBD")
        .stroke();
    });

    // Subtotal
    doc.moveDown(1);
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text(`OVERALL ATTENDANCE: ${overallPercent}%`, { align: "right" });

    doc
      .fontSize(8)
      .fillColor(secondaryColor)
      .font("Helvetica-Oblique")
      .text(
        "* A minimum of 75% attendance is required to be eligible for end-semester examinations.",
        PAGE_MARGIN,
        height - 60,
      );
  });
};
