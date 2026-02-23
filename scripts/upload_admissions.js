const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

async function runUpload() {
  const API_BASE = "https://api.uniz.rguktong.in/api/v1";
  const filePath =
    "/Users/sreecharandesu/Projects/uniz-master/admissiondata/Final_Combined_Admissions.xlsx";

  console.log("Logging in as webmaster...");
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    username: "webmaster",
    password: "webmaster@uniz",
  });

  const token = loginRes.data.token;
  console.log("Login successful. Role verified.");

  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));

  console.log("Uploading file to bulk upload API (restricted to webmaster)...");
  const uploadRes = await axios.post(
    `${API_BASE}/profile/admin/student/upload`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    },
  );

  console.log("Upload response:", uploadRes.data);
  console.log("Monitoring progress...");

  const monitorUrl = `${API_BASE}/profile/admin/student/upload/progress`;
  let isDone = false;

  while (!isDone) {
    await new Promise((r) => setTimeout(r, 4000));
    try {
      const progRes = await axios.get(monitorUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = progRes.data;
      console.log(
        `[PROGRESS] ${data.percent}% | Total: ${data.total} | Success: ${data.success} | Fail: ${data.fail} | ETA: ${data.etaSeconds}s`,
      );

      if (data.status === "done" || data.status === "idle") {
        isDone = true;
        console.log("Upload process completed successfully.");
      }
    } catch (e) {
      console.error("Error monitoring progress:", e.message);
      isDone = true;
    }
  }
}

runUpload().catch((e) => {
  console.error("Process failed:", e.response ? e.response.data : e.message);
});
