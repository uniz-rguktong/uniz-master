const axios = require("axios");
const API_BASE = "https://api.uniz.rguktong.in/api/v1";
(async () => {
  try {
    const login = await axios.post(`${API_BASE}/auth/login`, {
      username: "O201103",
      password: "O201103@rguktong",
    });
    const token = login.data.token;
    const grades = await axios.get(`${API_BASE}/academics/grades`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(JSON.stringify(grades.data.grades.slice(0, 1), null, 2));
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
})();
