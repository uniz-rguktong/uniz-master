const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const BASE_URL = "http://localhost:3000/api/v1";

async function testUpload() {
  console.log("--- Starting Isolated Upload Test ---");

  // 1. Login as Admin
  console.log("Logging in as webmaster...");
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login/admin`, {
      username: "webmaster",
      password: "webmaster@uniz",
    });
    const token = loginRes.data.token;
    console.log("Login successful. Token acquired.");

    // Prepare form data for both uploads
    const form = new FormData();
    form.append(
      "file",
      fs.createReadStream("tests/data/full_batch_grades.xlsx"),
    );

    // 2. Upload File (Gateway)
    console.log("--- Attempting Upload via Gateway ---");
    try {
      const uploadRes = await axios.post(
        `${BASE_URL}/academics/grades/upload`,
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

      console.log("Gateway Upload Response Status:", uploadRes.status);
      console.log(
        "Gateway Upload Response Data:",
        JSON.stringify(uploadRes.data, null, 2),
      );
    } catch (e) {
      console.error("Gateway Upload Failed:", e.message);
      if (e.response) console.error(JSON.stringify(e.response.data));
    }

    // 3. Upload File (Direct - Port 3004)
    console.log("\n--- Attempting Upload via Direct Service (Port 3004) ---");
    const formDirect = new FormData();
    formDirect.append(
      "file",
      fs.createReadStream("tests/data/full_batch_grades.xlsx"),
    );

    try {
      const directUrl = "http://localhost:3004/grades/upload";
      const uploadResDirect = await axios.post(directUrl, formDirect, {
        headers: {
          ...formDirect.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      console.log("Direct Upload Response Status:", uploadResDirect.status);
      console.log(
        "Direct Upload Response Data:",
        JSON.stringify(uploadResDirect.data, null, 2),
      );
    } catch (e) {
      console.error("Direct Upload Failed:", e.message);
      if (e.response) console.error(JSON.stringify(e.response.data));
    }
  } catch (error) {
    console.error("Test Failed!");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testUpload();
