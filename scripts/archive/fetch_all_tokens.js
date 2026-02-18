const axios = require("axios");

const BASE_URL = "https://uniz-gateway.vercel.app/api/v1";

const credentials = [
  { role: "Director", username: "director", password: "director@uniz" },
  { role: "Webmaster", username: "webmaster", password: "webmaster@uniz" },
  { role: "Dean", username: "dean", password: "dean@uniz" },
  {
    role: "Caretaker (Female)",
    username: "caretaker_female",
    password: "caretaker@uniz",
  },
  {
    role: "Caretaker (Male)",
    username: "caretaker_male",
    password: "caretaker@uniz",
  },
  { role: "SWO ", username: "swo", password: "swo@uniz" },
  {
    role: "Warden (Male)",
    username: "warden_male",
    password: "warden_male@uniz",
  },
  {
    role: "Warden (Female)",
    username: "warden_female",
    password: "warden_female@uniz",
  },
  { role: "Security", username: "security", password: "security@uniz" },
  {
    role: "Security Admin",
    username: "security",
    password: "security@uniz",
  },
  {
    role: "Librarian",
    username: "librarian",
    password: "librarian@uniz",
  },
  { role: "Student (O210008)", username: "O210008", password: "password123" },
];

async function getTokens() {
  console.log("\n--- TOKENS FOR ROLES ---\n");

  for (const cred of credentials) {
    let token = null;
    // Include variants from user feedback
    const passwords = [
      cred.password,
      `${cred.username}@uniz`,
      "dean@uniz",
      "123456",
      "password123",
    ];

    for (const p of passwords) {
      try {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
          username: cred.username,
          password: p,
        });
        token = res.data.token;
        break;
      } catch (error) {
        // Continue
      }
    }

    if (token) {
      console.log(`${cred.role}: ${token}\n`);
    } else {
      console.log(`${cred.role}: FAILED\n`);
    }
  }
}

getTokens();
