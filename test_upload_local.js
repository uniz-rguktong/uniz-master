const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

// Target the local Docker Gateway directly
const BASE_URL = "http://localhost:8080/api/v1";

// Using a dummy path, assuming script is run from root where file exists
const FILE_PATH = "full_batch_grades.xlsx";

async function run() {
  console.log(`🚀 Starting Local Bulk Upload Test against ${BASE_URL}`);

  // 1. Login
  console.log("🔑 Logging in as Webmaster...");
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login/admin`, {
      username: "webmaster",
      password: "webmaster@uniz",
    });
    const token = loginRes.data.token;
    console.log("✅ Token Acquired");

    // 2. Upload
    console.log(`📤 Uploading ${FILE_PATH}...`);
    const form = new FormData();
    form.append("file", fs.createReadStream(FILE_PATH));
    form.append("attribution", "WEBMASTER");
    form.append("integrityToken", "uniz_core_secret_key_v2");

    const uploadRes = await axios.post(
      `${BASE_URL}/academics/grades/upload?lb=local_test`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    );

    console.log("✅ Upload Successful!");
    console.log("Status:", uploadRes.status);
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
