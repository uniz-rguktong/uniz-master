/**
 * Generates a sample registration PDF without touching the database.
 * Run: npm run sample:registration-pdf -w uniz-academics-service
 */
import fs from "fs";
import path from "path";
import { generateRegistrationPdf } from "../src/utils/pdf.util";

async function main() {
  const sample = {
    username: "O21CS0123",
    name: "Sree Charan Desu",
    branch: "CSE",
    batch: "O21",
    year: "E3",
    campus: "Ongole",
    semesterName: "AY 2025-26 E3-SEM-1",
    semesterId: "AY-2025-26-E3-SEM-1",
    registrationId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    submittedAt: new Date(),
    subjects: [
      {
        code: "CS301",
        name: "Design and Analysis of Algorithms",
        credits: 4,
        type: "CORE",
      },
      {
        code: "CS302",
        name: "Database Management Systems",
        credits: 4,
        type: "CORE",
      },
      {
        code: "CS303",
        name: "Computer Networks",
        credits: 3,
        type: "CORE",
      },
      {
        code: "CS3PE1",
        name: "Cloud Computing",
        credits: 3,
        type: "ELECTIVE",
      },
      {
        code: "HS301",
        name: "Professional Ethics and Human Values",
        credits: 2,
        type: "CORE",
      },
    ],
    totalCredits: 16,
  };

  const pdfBuffer = await generateRegistrationPdf(sample);
  const outDir = path.join(__dirname, "..", "sample-output");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "registration-slip-sample.pdf");
  fs.writeFileSync(outPath, pdfBuffer);

  console.log(`Sample registration PDF written to:\n  ${outPath}`);
  console.log(`Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
