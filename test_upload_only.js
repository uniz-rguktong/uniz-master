const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://api.uniz.rguktong.in/api/v1";
const FILE_PATH = "infra/core-infra/tests/data/full_batch_grades.xlsx";

async function run() {
  console.log("🚀 Starting Targeted Bulk Upload Test");

  // 1. Login as Webmaster (to get token)
  console.log("🔑 Logging in as Webmaster...");
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login/admin`, {
      username: "webmaster",
      password: "webmaster@uniz", // Using standard test creds
    });
    const token = loginRes.data.token;
    console.log("✅ Token Acquired");

    // 2. Upload File
    console.log(`📤 Uploading ${FILE_PATH}...`);
    const form = new FormData();
    form.append("file", fs.createReadStream(FILE_PATH));
    form.append("attribution", "WEBMASTER");
    form.append("integrityToken", "uniz_core_secret_key_v2"); // Assuming dev secret

    const uploadRes = await axios.post(
      `${BASE_URL}/academics/grades/upload?lb=test_${Date.now()}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${token}`,
          "User-Agent": "UniZ-Integrity-Agent/1.0",
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    );

    console.log("✅ Upload Successful!");
    console.log("Status:", uploadRes.status);
    console.log("Data:", JSON.stringify(uploadRes.data, null, 2));
  } catch (error) {
    console.error("❌ Upload Failed!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
  }
}

run();
