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

  // Calculate GPA/Credits
  let totalCredits = 0;
  let earnedPoints = 0;
  grades.forEach((g) => {
    const credit = Number(g.subject.credits);
    const gradePoint = Number(g.grade);
    totalCredits += credit;
    // GPA typically includes all credits registered, but let's follow standard
    // If gradePoint is 0 (Remedial), it counts as attempted (credits added) but 0 points.
    if (credit > 0) {
      earnedPoints += credit * (gradePoint > 0 ? gradePoint : 0);
    }
  });

  const sgpa =
    totalCredits > 0 ? (earnedPoints / totalCredits).toFixed(2) : "0.00";
  /* 
    Title Logic:
    1. Try to parse E#S# or P#S# from semesterId (e.g., "E2S1", "AY24-E3-S2")
    2. If not found, try to infer from first subject code (e.g., "CS2101" -> E2 S1)
    3. Fallback to raw semesterId
  */
  let titleText = `${semesterId.toUpperCase()} RESULTS`;

  // Regex for E1S1, P2S1, E3-S2, etc.
  // Regex for E1S1, P2S1, E3-S2, etc.
  // We decouple Year and Sem extraction to handle cases like "SEM-1" (Year missing)

  let yearStr = "";
  let semStr = "";

  // 1. Try to extract Year (E1-E4, P1-P2) from semesterId
  const yearMatch = semesterId.match(/([EP])[-_ ]?([1-4])/i);
  if (yearMatch) {
    yearStr = `${yearMatch[1].toUpperCase()}${yearMatch[2]}`;
  }

  // 2. Try to extract Semester (S1-S3) from semesterId
  const semMatch = semesterId.match(/S(?:em(?:ester)?)?[-_ ]?([1-3])/i);
  if (semMatch) {
    semStr = semMatch[1];
  }

  // 3. Fallback: Infer Year from Subject Code if missing (e.g. CS2101 -> E2)
  if (
    !yearStr &&
    grades.length > 0 &&
    grades[0].subject &&
    grades[0].subject.code
  ) {
    // Matches: First digit after letters (CS2... -> 2)
    const codeMatch = grades[0].subject.code.match(/^[a-zA-Z]+[-_ ]?([1-4])/);
    if (codeMatch) {
      yearStr = `E${codeMatch[1]}`; // Default to Engineering
    }
  }

  if (yearStr && semStr) {
    titleText = `${yearStr} SEMESTER-${semStr} RESULTS`;
  } else {
    // Fallback if partial info
    titleText = `${semesterId.toUpperCase()} RESULTS`.replace(
      " RESULTS RESULTS",
      " RESULTS",
    );
  }

  const getGradeLetter = (point: number) => {
    if (point >= 10) return "EX";
    if (point >= 9) return "A";
    if (point >= 8) return "B";
    if (point >= 7) return "C";
    if (point >= 6) return "D";
    if (point >= 5) return "E";
    return "R";
  };

  const rows = grades.map((g) => ({
    title: g.subject.name,
    credits: g.subject.credits.toFixed(1),
    gradeLetter: getGradeLetter(g.grade),
  }));

  return createPdfBuffer((doc) => {
    const { width } = doc.page;
    const usableWidth = width - PAGE_MARGIN * 2;
    const tableStartX = PAGE_MARGIN;

    // Watermark
    doc.save();
    doc.rotate(-45, { origin: [width / 2, 400] });
    doc
      .fillColor("rgba(0,0,0,0.05)")
      .fontSize(80)
      .text(`RGUKT ${campus.toUpperCase()}`, {
        align: "center",
      });
    doc.restore();

    // Header
    doc.fillColor("#cc0000");
    doc.font("Helvetica-Bold");
    doc
      .fontSize(22)
      .text("RAJIV GANDHI UNIVERSITY OF KNOWLEDGE", { align: "center" });
    doc.text("TECHNOLOGIES - ANDHRA PRADESH", { align: "center" });

    doc.font("Helvetica");
    doc
      .fontSize(8.5)
      .text(
        "(Established by the Govt. of Andhra Pradesh and recognized as per Section 2(f), 12(B) of UGC Act, 1956)",
        { align: "center" },
      );

    // Orange separator
    doc.moveDown(0.5);
    doc
      .moveTo(PAGE_MARGIN, doc.y)
      .lineTo(PAGE_MARGIN + usableWidth, doc.y)
      .lineWidth(3)
      .strokeColor("#ff9900")
      .stroke();

    doc.moveDown(1);

    // Student info table (2 rows, 4 columns)
    const cellHeight = 18;
    const colWidths = [
      usableWidth * 0.15,
      usableWidth * 0.35,
      usableWidth * 0.15,
      usableWidth * 0.35,
    ];
    let y = doc.y;

    const drawRow = (
      leftLabel: string,
      leftValue: string,
      rightLabel: string,
      rightValue: string,
    ) => {
      let x = tableStartX;
      const labels = [leftLabel, leftValue, rightLabel, rightValue];

      // Cells
      for (let i = 0; i < 4; i++) {
        doc
          .rect(x, y, colWidths[i], cellHeight)
          .lineWidth(0.5)
          .strokeColor("#dddddd")
          .stroke();
        x += colWidths[i];
      }

      // Text
      x = tableStartX;
      doc.fontSize(10).fillColor("#000000");
      doc.text(leftLabel, x + 4, y + 4, { width: colWidths[0] - 8 });
      x += colWidths[0];
      doc
        .font("Helvetica-Bold")
        .text(leftValue, x + 4, y + 4, { width: colWidths[1] - 8 });
      x += colWidths[1];
      doc
        .font("Helvetica")
        .text(rightLabel, x + 4, y + 4, { width: colWidths[2] - 8 });
      x += colWidths[2];
      doc
        .font("Helvetica-Bold")
        .text(rightValue, x + 4, y + 4, { width: colWidths[3] - 8 });

      y += cellHeight;
    };

    drawRow("ID", username, "Branch:", branch);
    drawRow("Name:", name, "Campus:", campus);
    doc.moveDown(1.5);

    // Results title
    doc.font("Helvetica-Bold");
    doc.fontSize(16).fillColor("#000000").text(titleText, { align: "center" });
    doc.moveDown(1.2);

    // Results table
    const headerHeight = 22;
    const rowHeight = 20;
    const colTitleWidth = usableWidth * 0.7;
    const colCreditsWidth = usableWidth * 0.15;
    const colGradeWidth = usableWidth * 0.15;

    let tableY = doc.y;

    // Table Borders Configuration
    const drawTableBorder = (y1: number, y2: number) => {
      doc
        .lineWidth(1)
        .strokeColor("#000000")
        .rect(tableStartX, y1, usableWidth, y2 - y1)
        .stroke();

      // Vertical lines
      doc
        .moveTo(tableStartX + colTitleWidth, y1)
        .lineTo(tableStartX + colTitleWidth, y2)
        .stroke();
      doc
        .moveTo(tableStartX + colTitleWidth + colCreditsWidth, y1)
        .lineTo(tableStartX + colTitleWidth + colCreditsWidth, y2)
        .stroke();
    };

    // Header with green borders
    doc.lineWidth(2).strokeColor("#008000");
    doc
      .moveTo(tableStartX, tableY)
      .lineTo(tableStartX + usableWidth, tableY)
      .stroke();
    doc
      .moveTo(tableStartX, tableY + headerHeight)
      .lineTo(tableStartX + usableWidth, tableY + headerHeight)
      .stroke();

    doc.fontSize(12).font("Helvetica-Bold").fillColor("#000000");
    let x = tableStartX;
    doc.text("COURSE TITLE", x + 6, tableY + 6, { width: colTitleWidth - 12 });
    x += colTitleWidth;
    doc.text("Credits", x, tableY + 6, {
      width: colCreditsWidth,
      align: "center",
    });
    x += colCreditsWidth;
    doc.text("Grade", x, tableY + 6, { width: colGradeWidth, align: "center" });

    // Body rows
    const tableBodyStartY = tableY + headerHeight;
    tableY += headerHeight;
    doc.fontSize(11).font("Helvetica");

    rows.forEach((r) => {
      let colX = tableStartX;

      doc.text(r.title, colX + 6, tableY + 6, { width: colTitleWidth - 12 });
      colX += colTitleWidth;
      doc.text(r.credits, colX, tableY + 6, {
        width: colCreditsWidth,
        align: "center",
      });
      colX += colCreditsWidth;
      doc.text(r.gradeLetter, colX, tableY + 6, {
        width: colGradeWidth,
        align: "center",
      });

      tableY += rowHeight;

      doc
        .lineWidth(0.5)
        .strokeColor("#333333")
        .moveTo(tableStartX, tableY)
        .lineTo(tableStartX + usableWidth, tableY)
        .stroke();
    });

    // Total row
    doc.font("Helvetica-Bold");
    let totalX = tableStartX;
    doc.text("Total", totalX, tableY + 6, {
      width: colTitleWidth - 6,
      align: "right",
    });
    totalX += colTitleWidth;
    doc.text(totalCredits.toFixed(0), totalX, tableY + 6, {
      width: colCreditsWidth,
      align: "center",
    });
    totalX += colCreditsWidth;
    doc.text(earnedPoints.toFixed(1), totalX, tableY + 6, {
      width: colGradeWidth,
      align: "center",
    });

    tableY += rowHeight;
    doc
      .lineWidth(1)
      .strokeColor("#000000")
      .moveTo(tableStartX, tableY)
      .lineTo(tableStartX + usableWidth, tableY)
      .stroke();

    // SGPA row
    let sgpaX = tableStartX;
    doc.text("SGPA", sgpaX, tableY + 6, {
      width: colTitleWidth + colCreditsWidth - 6,
      align: "right",
    });
    sgpaX += colTitleWidth + colCreditsWidth;
    doc.text(sgpa, sgpaX, tableY + 6, {
      width: colGradeWidth,
      align: "center",
    });

    tableY += rowHeight;

    drawTableBorder(tableBodyStartY - headerHeight, tableY);
  });
};

export const generateAttendancePdf = async (
  data: AttendanceData,
): Promise<Buffer> => {
  const { name, username, branch, semesterId, records, campus } = data;

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

  const rows = records.map((r) => {
    const percent =
      r.totalClasses > 0
        ? ((r.attendedClasses / r.totalClasses) * 100).toFixed(1)
        : "0.0";
    return {
      title: `${r.subject.name} (${r.subject.code})`,
      attended: r.attendedClasses,
      total: r.totalClasses,
      percent,
    };
  });

  return createPdfBuffer((doc) => {
    const { width } = doc.page;
    const usableWidth = width - PAGE_MARGIN * 2;
    const tableStartX = PAGE_MARGIN;

    // Watermark
    doc.save();
    doc.rotate(-45, { origin: [width / 2, 400] });
    doc
      .fillColor("rgba(0,0,0,0.05)")
      .fontSize(80)
      .text(`RGUKT ${campus.toUpperCase()}`, {
        align: "center",
      });
    doc.restore();

    // Header
    doc.fillColor("#cc0000");
    doc.font("Helvetica-Bold");
    doc
      .fontSize(22)
      .text("RAJIV GANDHI UNIVERSITY OF KNOWLEDGE", { align: "center" });
    doc.text("TECHNOLOGIES - ANDHRA PRADESH", { align: "center" });

    doc.font("Helvetica");
    doc
      .fontSize(8.5)
      .text(
        "(Established by the Govt. of Andhra Pradesh and recognized as per Section 2(f), 12(B) of UGC Act, 1956)",
        { align: "center" },
      );

    // Orange separator
    doc.moveDown(0.5);
    doc
      .moveTo(PAGE_MARGIN, doc.y)
      .lineTo(PAGE_MARGIN + usableWidth, doc.y)
      .lineWidth(3)
      .strokeColor("#ff9900")
      .stroke();

    doc.moveDown(1);

    // Student info table (2 rows, 4 columns)
    const cellHeight = 18;
    const colWidths = [
      usableWidth * 0.15,
      usableWidth * 0.35,
      usableWidth * 0.15,
      usableWidth * 0.35,
    ];
    let y = doc.y;

    const drawRow = (
      leftLabel: string,
      leftValue: string,
      rightLabel: string,
      rightValue: string,
    ) => {
      let x = tableStartX;

      // Cells
      for (let i = 0; i < 4; i++) {
        doc
          .rect(x, y, colWidths[i], cellHeight)
          .lineWidth(0.5)
          .strokeColor("#dddddd")
          .stroke();
        x += colWidths[i];
      }

      // Text
      x = tableStartX;
      doc.fontSize(10).fillColor("#000000");
      doc.text(leftLabel, x + 4, y + 4, { width: colWidths[0] - 8 });
      x += colWidths[0];
      doc
        .font("Helvetica-Bold")
        .text(leftValue, x + 4, y + 4, { width: colWidths[1] - 8 });
      x += colWidths[1];
      doc
        .font("Helvetica")
        .text(rightLabel, x + 4, y + 4, { width: colWidths[2] - 8 });
      x += colWidths[2];
      doc
        .font("Helvetica-Bold")
        .text(rightValue, x + 4, y + 4, { width: colWidths[3] - 8 });

      y += cellHeight;
    };

    drawRow("ID", username, "Branch:", branch);
    drawRow("Name:", name, "Campus:", campus);
    doc.moveDown(1.5);

    // Title
    doc.font("Helvetica-Bold");
    doc
      .fontSize(16)
      .fillColor("#000000")
      .text(`ATTENDANCE REPORT: ${semesterId.toUpperCase()}`, {
        align: "center",
      });
    doc.moveDown();

    // Results table
    const headerHeight = 20;
    const rowHeight = 18;
    const colTitleWidth = usableWidth * 0.55;
    const colAttWidth = usableWidth * 0.25;
    const colPercentWidth = usableWidth * 0.2;

    let tableY = doc.y;

    // Outer border
    doc
      .rect(
        tableStartX,
        tableY,
        usableWidth,
        headerHeight + rows.length * rowHeight + rowHeight * 2,
      )
      .lineWidth(1.5)
      .strokeColor("#000000")
      .stroke();

    // Header
    doc
      .rect(tableStartX, tableY, usableWidth, headerHeight)
      .lineWidth(1)
      .strokeColor("#000000")
      .stroke();

    doc.fontSize(12).font("Helvetica-Bold");
    let x = tableStartX;
    doc.text("Course Title", x + 6, tableY + 4, {
      width: colTitleWidth - 12,
    });
    x += colTitleWidth;
    doc.text("Attended / Total", x, tableY + 4, {
      width: colAttWidth,
      align: "center",
    });
    x += colAttWidth;
    doc.text("Percentage", x, tableY + 4, {
      width: colPercentWidth,
      align: "center",
    });

    // Body
    tableY += headerHeight;
    doc.fontSize(11).font("Helvetica");

    rows.forEach((r) => {
      let colX = tableStartX;
      doc
        .moveTo(tableStartX, tableY)
        .lineTo(tableStartX + usableWidth, tableY)
        .lineWidth(0.5)
        .strokeColor("#000000")
        .stroke();

      doc.text(r.title, colX + 6, tableY + 4, {
        width: colTitleWidth - 12,
      });
      colX += colTitleWidth;
      doc.text(`${r.attended} / ${r.total}`, colX, tableY + 4, {
        width: colAttWidth,
        align: "center",
      });
      colX += colAttWidth;
      doc.text(`${r.percent}%`, colX, tableY + 4, {
        width: colPercentWidth,
        align: "center",
      });

      tableY += rowHeight;
    });

    // Overall total row
    doc.font("Helvetica-Bold");
    doc
      .moveTo(tableStartX, tableY)
      .lineTo(tableStartX + usableWidth, tableY)
      .lineWidth(0.75)
      .strokeColor("#000000")
      .stroke();

    let totalX = tableStartX;
    doc.text("OVERALL TOTAL", totalX, tableY + 4, {
      width: colTitleWidth - 6,
      align: "right",
    });
    totalX += colTitleWidth;
    doc.text(`${totalAttended} / ${totalClasses}`, totalX, tableY + 4, {
      width: colAttWidth,
      align: "center",
    });
    totalX += colAttWidth;
    doc.text(`${overallPercent}%`, totalX, tableY + 4, {
      width: colPercentWidth,
      align: "center",
    });

    doc.moveDown(2);
    doc.font("Helvetica").fontSize(10).fillColor("#666666");
    doc.text(
      "* Mandatory 75% attendance is required to appear for examinations.",
    );
    doc.fontSize(9).text(`Generated on: ${new Date().toLocaleString()}`);
  });
};
