const axios = require("axios");
const GATEWAY = "https://uniz-gateway.vercel.app/api/v1";

async function fixUser() {
  try {
    const login = await axios.post(`${GATEWAY}/auth/login`, {
      username: "webmaster",
      password: "webmaster@uniz",
    });
    const token = login.data.token;

    await axios.put(
      `${GATEWAY}/profile/admin/student/O210008`,
      {
        gender: "M",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    console.log("✅ Fixed O210008 gender to 'M'");
  } catch (e) {
    console.error("Fix failed:", e.message);
  }
}
fixUser();
