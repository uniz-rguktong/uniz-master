const axios = require("axios");

async function signupTestStudent() {
  try {
    const res = await axios.post("http://localhost:3001/signup", {
      username: "o210008",
      password: "sree@2006",
      role: "student",
    });
    console.log("Student o210008 signed up successfully:", res.status);
  } catch (err) {
    if (err.response && err.response.status === 409) {
      console.log("Student o210008 already exists.");
    } else {
      console.error(
        "Failed to sign up student:",
        err.response ? err.response.data : err.message,
      );
    }
  }
}

signupTestStudent();
