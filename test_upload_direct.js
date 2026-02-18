const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// DIRECT to Academics Service
const BASE_URL = "http://localhost:3004";
const FILE_PATH = "full_batch_grades.xlsx";

async function run() {
  console.log(`🚀 Starting DIRECT Bulk Upload Test against ${BASE_URL}`);

  // We need a token, but let's see if we can get it from Auth service or just reuse one if we had it.
  // Actually, for simplicity, I'll just login via the Gateway (port 8080) to get the token,
  // then use that token against direct service.

  let token = "";
  try {
    console.log("🔑 Logging in via Gateway...");
    const loginRes = await axios.post(
      `http://localhost:8080/api/v1/auth/login/admin`,
      {
        username: "webmaster",
        password: "webmaster@uniz",
      },
    );
    token = loginRes.data.token;
    console.log("✅ Token Acquired");
  } catch (e) {
    console.error("Login failed:", e.message);
    return;
  }

  try {
    console.log(`📤 Uploading ${FILE_PATH} DIRECTLY to Academics...`);
    const form = new FormData();
    form.append("file", fs.createReadStream(FILE_PATH));
    form.append("attribution", "WEBMASTER");
    form.append("integrityToken", "uniz_core_secret_key_v2");

    const uploadRes = await axios.post(
      `${BASE_URL}/grades/upload?lb=direct_test`,
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

    console.log("✅ Direct Upload Successful!");
    console.log("Status:", uploadRes.status);
  } catch (error) {
    console.error("❌ Direct Upload Failed!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
  }
}

run();
