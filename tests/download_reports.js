const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function downloadReports() {
  const BASE_URL = "https://api.uniz.rguktong.in/api/v1";
  const downloadDir = path.join(process.cwd(), "downloads");
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

  console.log("Logging in...");
  try {
    const loginRes = await axios.post(BASE_URL + "/auth/login", {
      username: "webmaster",
      password: "webmaster@uniz",
    });
    const token = loginRes.data.token;
    const headers = { Authorization: "Bearer " + token };

    const files = [
      {
        name: "Grades_O210008.pdf",
        url: "/academics/grades/download/E2-SEM-1?studentId=O210008",
      },
      {
        name: "Attendance_O210008.pdf",
        url: "/academics/attendance/download/E2-SEM-1?studentId=O210008",
      },
    ];

    for (const file of files) {
      try {
        console.log(`Downloading ${file.name}...`);
        const res = await axios({
          method: "get",
          url: BASE_URL + file.url,
          headers: headers,
          responseType: "arraybuffer",
        });

        const filePath = path.join(downloadDir, file.name);
        fs.writeFileSync(filePath, res.data);
        console.log(`✅ Saved to: ${filePath}`);
      } catch (err) {
        console.error(
          `❌ Failed to download ${file.name}:`,
          err.response?.data?.toString() || err.message,
        );
      }
    }
  } catch (err) {
    console.error("Login failed:", err.message);
  }
}
downloadReports();
