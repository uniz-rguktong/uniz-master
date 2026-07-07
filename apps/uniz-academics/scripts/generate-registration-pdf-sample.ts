/**
 * Generates a sample registration PDF without touching the database.
 * Run: npm run sample:registration-pdf -w uniz-academics-service
 */
import fs from "fs";
import path from "path";
import { generateRegistrationPdf, generateBulkRegistrationPdf } from "../src/utils/pdf.util";

const sampleSubjects = [
  { code: "23PEG1201", name: "English-II", credits: 4, type: "CORE" },
  { code: "23PMA1201", name: "Mathematics-II", credits: 5, type: "CORE" },
  { code: "23PPY1201", name: "Physics-II", credits: 4, type: "CORE" },
  { code: "23PPY1210", name: "Physics Lab-II", credits: 1, type: "CORE" },
  { code: "23PCY1201", name: "Chemistry-II", credits: 4, type: "CORE" },
  { code: "23PCY1210", name: "Chemistry Lab-II", credits: 1, type: "CORE" },
  { code: "23PTE1201", name: "Telugu-II", credits: 3, type: "CORE" },
  { code: "23PIT1201", name: "Open office&LATEX", credits: 2, type: "CORE" },
  { code: "23PIT1210", name: "Open office&LATEX-LAB", credits: 1, type: "CORE" },
  { code: "23PBE1202", name: "Elementary Biology", credits: 0, type: "CORE" },
];

async function main() {
  const sample = {
    username: "N240671",
    name: "VANJARAPU SRAVYA",
    branch: "PUC",
    batch: "N24",
    year: "P1",
    campus: "Ongole",
    semesterName: "AY 2024-25 P1-SEM-2",
    semesterId: "AY-2024-25-P1-SEM-2",
    registrationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    submittedAt: new Date(),
    subjects: sampleSubjects,
    totalCredits: 25,
  };

  const pdfBuffer = await generateRegistrationPdf(sample);
  const bulkBuffer = await generateBulkRegistrationPdf([
    sample,
    {
      ...sample,
      username: "N240672",
      name: "SAMPLE STUDENT TWO",
      registrationId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    },
    {
      ...sample,
      username: "N240673",
      name: "SAMPLE STUDENT THREE",
      registrationId: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    },
  ]);
  const outDir = path.join(__dirname, "..", "sample-output");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "registration-slip-sample.pdf");
  const bulkPath = path.join(outDir, "registration-slip-bulk-sample.pdf");
  fs.writeFileSync(outPath, pdfBuffer);
  fs.writeFileSync(bulkPath, bulkBuffer);

  console.log(`Sample registration PDF written to:\n  ${outPath}`);
  console.log(`Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
  console.log(`Bulk sample (2 per A4 page) written to:\n  ${bulkPath}`);
  console.log(`Size: ${(bulkBuffer.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
