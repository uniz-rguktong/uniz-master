const fs = require("fs");
const path = require("path");

const filePath = path.join(
  __dirname,
  "uniz-academics/src/controllers/academic.controller.ts",
);
let content = fs.readFileSync(filePath, "utf8");

const OLD_BLOCK = `    const headers: string[] = [];
    headerRow.eachCell((cell) => {
      headers.push(String(cell.value).trim());
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const val = cell.value;
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] =
            val && typeof val === "object" && "text" in val
              ? (val as any).text
              : String(val ?? "").trim();
        }
      });
      rows.push(rowData);
    });`;

const NEW_BLOCK = `    const colCount = worksheet.columnCount;
    const headers: string[] = [];
    for (let i = 1; i <= colCount; i++) {
      const cell = headerRow.getCell(i);
      headers.push(cell.value ? String(cell.value).trim() : "");
    }

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowData: any = {};
      for (let i = 1; i <= colCount; i++) {
        const header = headers[i - 1];
        if (header) {
          const val = row.getCell(i).value;
          rowData[header] =
            val && typeof val === "object" && "text" in val
              ? (val as any).text
              : String(val ?? "").trim();
        }
      }
      rows.push(rowData);
    });`;

// Try to match with potential whitespace differences
// We'll replace the first two occurrences (grades and attendance)
content = content.split(OLD_BLOCK).join(NEW_BLOCK);

fs.writeFileSync(filePath, content);
console.log("Fixed academic.controller.ts");
