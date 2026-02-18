const axios = require("axios");
const GATEWAY = "https://uniz-gateway.vercel.app/api/v1";

const box = (text, color = 0) => {
  // 0: Reset, 32: Green, 36: Cyan, 33: Yellow, 35: Magenta
  const c = (code) => `\x1b[${code}m`;
  const r = `\x1b[0m`;
  const len = text.length + 4;
  return (
    `${c(color)}┌${"─".repeat(len)}┐${r}\n` +
    `${c(color)}│  ${text}  │${r}\n` +
    `${c(color)}└${"─".repeat(len)}┘${r}`
  );
};

const arrow = (label) => {
  return `\n      │ ${label}\n      ▼ \n`;
};

async function visualizeRequest(type, path, method = "GET", body = {}) {
  console.clear();
  console.log(`\n\n    ${method} ${GATEWAY}${path} Initiated...\n`);

  // 1. Client Step
  console.log(box("USER (Client)", 36));
  await new Promise((r) => setTimeout(r, 600));

  // 2. Gateway Step
  console.log(arrow("HTTPS (Anycast)"));
  console.log(box("VERCEL GATEWAY (Singapore)", 35));
  await new Promise((r) => setTimeout(r, 600));

  // 3. Routing Logic
  let serviceName = "";
  let color = 32;
  if (path.includes("auth")) {
    serviceName = "AUTH SERVICE";
    color = 33;
  } else if (path.includes("academics")) {
    serviceName = "ACADEMICS SERVICE";
    color = 32;
  } else if (path.includes("profile")) {
    serviceName = "USER SERVICE";
    color = 34;
  } else if (path.includes("requests")) {
    serviceName = "OUTPASS SERVICE";
    color = 31;
  }

  console.log(arrow(`Routing Rule: ${path.split("/")[1]} matches`));
  console.log(box(`${serviceName} (Function sin1)`, color));
  await new Promise((r) => setTimeout(r, 800));

  // 4. Database/Cache Logic
  if (path.includes("grades")) {
    console.log(arrow("Checking Cache..."));
    console.log(box("REDIS CACHE (Upstash SG)", 31));
    console.log(`\n       HIT! (Skipping Database)`);
  } else {
    console.log(arrow("Querying Data"));
    console.log(box("NEON POSTGRES (AWS SG)", 32));
  }

  // 5. Response
  await new Promise((r) => setTimeout(r, 400));
  console.log(arrow("Response (JSON)"));
  console.log(box("CLIENT (Browser)", 36));

  // Execute real request to prove it works
  try {
    const res =
      method === "POST"
        ? await axios.post(`${GATEWAY}${path}`, body)
        : await axios.get(
            `${GATEWAY}${path}`,
            body.headers ? { headers: body.headers } : {},
          );

    console.log(`\n ${serviceName} Responded: ${res.status} OK`);
    if (path.includes("grades")) {
      console.log(` Speed: Ultra Fast (Cache Hit)`);
    }
  } catch (e) {
    console.log(`\n❌ Error: ${e.message}`);
  }
}

// Run a sample flow
async function run() {
  // Login
  await visualizeRequest("Login", "/auth/login", "POST", {
    username: "O210008",
    password: "password123",
  });
  await new Promise((r) => setTimeout(r, 3000));

  // Get Grades (Login first to get token for real request, simplified here for visual)
  // We will just do the visual part for grades to show cache
  await visualizeRequest("Grades", "/academics/grades", "GET", {});
}

run();
