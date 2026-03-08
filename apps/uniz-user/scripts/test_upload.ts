import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { uploadStudents } from "../src/controllers/bulk.controller";

async function testUpload(filePath: string) {
  console.log(`Testing upload for: ${filePath}`);
  const buffer = fs.readFileSync(filePath);

  // Mock Request
  const req = {
    user: { username: "internal_tester", role: "webmaster" },
    file: {
      buffer,
      originalname: path.basename(filePath),
      mimetype:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  };

  // Mock Response
  const res = {
    status: (code: number) => {
      console.log(`Response Status: ${code}`);
      return res;
    },
    json: (data: any) => {
      console.log(`Response Data:`, JSON.stringify(data, null, 2));
      return res;
    },
  };

  try {
    await uploadStudents(req as any, res as any);
    console.log("Upload initiated. Waiting for background processing...");
    // The controller runs ingestion in background. We might need to wait or check DB.
    await new Promise((r) => setTimeout(r, 15000)); // Wait for chunks
  } catch (e) {
    console.error("Upload Error:", e);
  }
}

async function main() {
  const files = [
    "../../tests/data/o20.xlsx",
    "../../tests/data/o21.xlsx",
    "../../tests/data/o22.xlsx",
  ];

  for (const f of files) {
    const absPath = path.resolve(__dirname, f);
    if (fs.existsSync(absPath)) {
      await testUpload(absPath);
    } else {
      console.error(`File not found: ${absPath}`);
    }
  }
}

main().catch(console.error);
