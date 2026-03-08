import axios from "axios";
import fs from "fs";
import FormData from "form-data";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE5NzM4YmUwLTUxMjItNGRjMS04NWMxLTFhZTIwZjRjM2E0OCIsInVzZXJuYW1lIjoiV0VCTUFTVEVSIiwicm9sZSI6IndlYm1hc3RlciIsImlhdCI6MTc3MjcxMDM0NSwiZXhwIjoxNzczMzE1MTQ1fQ.K3k_dyVhCrL1gUAF4eoprGoyPyyiV_sfq3j6rFLQQsc";
const BASE_URL = "https://api.uniz.rguktong.in/api/v1";
const FILE_PATH =
  "/Users/sreecharandesu/Projects/uniz-master/tests/data/grades_upload/O21_E1_SEM-2.xlsx";

async function testUpload() {
  console.log(`🚀 Starting Grades Upload test for: ${FILE_PATH}`);

  const form = new FormData();
  form.append("file", fs.createReadStream(FILE_PATH));

  try {
    const uploadRes = await axios.post(
      `${BASE_URL}/academics/grades/upload`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${TOKEN}`,
        },
      },
    );

    console.log("✅ Upload Request Accepted:", uploadRes.data);
    const { uploadId } = uploadRes.data;

    if (!uploadId) {
      console.error("❌ No uploadId returned!");
      return;
    }

    console.log(`\n⏳ Polling Progress for uploadId: ${uploadId}...`);

    let isDone = false;
    let attempts = 0;
    while (!isDone && attempts < 60) {
      const progressRes = await axios.get(
        `${BASE_URL}/academics/upload/progress?uploadId=${uploadId}`,
        {
          headers: { Authorization: `Bearer ${TOKEN}` },
        },
      );

      const { progress } = progressRes.data;
      console.log(
        `[${new Date().toLocaleTimeString()}] Progress: ${progress.percent}% | Processed: ${progress.processed}/${progress.total} | Status: ${progress.status}`,
      );

      if (progress.errors && progress.errors.length > 0) {
        console.warn(
          `⚠️ Errors detected (first 3):`,
          progress.errors.slice(0, 3),
        );
      }

      if (
        progress.status === "completed" ||
        progress.status === "done" ||
        progress.status === "failed"
      ) {
        isDone = true;
        console.log(`\n🏁 Final Status: ${progress.status}`);
        console.log(`Success: ${progress.success}, Fail: ${progress.fail}`);
      } else {
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;
      }
    }

    if (!isDone) {
      console.error("❌ Polling timed out (2 minutes)");
    }
  } catch (err) {
    console.error("❌ Test failed:", err.response?.data || err.message);
  }
}

testUpload();
