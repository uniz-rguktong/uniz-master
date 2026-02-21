const https = require("https");

function req(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const headers = {};
    if (token) headers["Authorization"] = "Bearer " + token;
    if (body) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(body);
    }
    const r = https.request(
      {
        hostname: "api.uniz.rguktong.in",
        path,
        method,
        headers,
        timeout: 15000,
      },
      (res) => {
        let b = "";
        res.on("data", (d) => (b += d));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(b) });
          } catch (e) {
            resolve({ status: res.statusCode, body: b });
          }
        });
      },
    );
    r.on("timeout", () => {
      reject(new Error("TIMEOUT"));
      r.destroy();
    });
    r.on("error", reject);
    if (body) r.write(body);
    r.end();
  });
}

async function main() {
  const login = await req("POST", "/api/v1/auth/login", {
    username: "webmaster",
    password: "webmaster@uniz",
  });
  const token = login.body.token;
  console.log(
    "Webmaster login:",
    login.status,
    token ? "✅ Token OK" : "❌ No token",
  );
  if (!token) return;

  console.log("\n--- GET /push/subscribers ---");
  const subs = await req(
    "GET",
    "/api/v1/notifications/push/subscribers",
    null,
    token,
  );
  console.log("Status:", subs.status);
  console.log(JSON.stringify(subs.body, null, 2));

  console.log("\n--- POST /push/send → O210139 ---");
  const send = await req(
    "POST",
    "/api/v1/notifications/push/send",
    {
      target: "user",
      username: "O210139",
      title: "Important Update",
      body: "Your outpass has been approved.",
    },
    token,
  );
  console.log("Status:", send.status);
  console.log(JSON.stringify(send.body, null, 2));
}

main().catch((e) => console.error("ERROR:", e.message));
