const axios = require("axios");
const fs = require("fs");
const API_BASE = "https://api.uniz.rguktong.in/api/v1";

async function testDownload() {
  const username = "O210008";
  const password = `${username}@rguktong`;

  try {
    console.log(`Logging in as ${username}...`);
    const login = await axios.post(`${API_BASE}/auth/login`, {
      username,
      password,
    });
    const token = login.data.token;
    console.log("Login successful.");

    console.log(`Checking grades for ${username}...`);
    const gradesRes = await axios.get(`${API_BASE}/academics/grades`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const grades = gradesRes.data.grades || [];
    console.log(`Found ${grades.length} grades.`);

    if (grades.length === 0) {
      console.log(
        "No grades found. Attempting download anyway to check status...",
      );
    }

    // Try downloading report for SEM-1
    console.log("Attempting report download for SEM-1...");
    try {
      const downloadRes = await axios.get(
        `${API_BASE}/academics/grades/download/SEM-1`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "arraybuffer",
        },
      );

      if (downloadRes.status === 200) {
        console.log(
          "Download SUCCESS! Content-Type:",
          downloadRes.headers["content-type"],
        );
        fs.writeFileSync("test_report.pdf", downloadRes.data);
        console.log("Saved to test_report.pdf");
      }
    } catch (downloadErr) {
      console.log(
        `Download API Response: ${downloadErr.response?.status} - ${JSON.stringify(downloadErr.response?.data)}`,
      );
    }
  } catch (e) {
    console.error("Error:", e.response?.data || e.message);
  }
}

testDownload();
