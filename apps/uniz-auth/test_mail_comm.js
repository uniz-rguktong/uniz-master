const dotenv = require("dotenv");
dotenv.config();

async function test() {
  console.log(
    "Testing uniz-auth -> uniz-mail communication (Vercel Fallback)...",
  );

  // Clear env vars to force fallback
  delete process.env.MAIL_SERVICE_URL;
  delete process.env.GATEWAY_URL;

  // Clear require cache for the util
  delete require.cache[require.resolve("./src/utils/email.util")];
  const { sendOtpEmail } = require("./src/utils/email.util");

  try {
    const success = await sendOtpEmail(
      "noreplycampusschield@gmail.com",
      "TEST_USER",
      "123456",
    );
    console.log("Success:", success);
  } catch (error) {
    console.log("Error URL:", error.config?.url);
    console.log("Error Status:", error.response?.status);
  }
}

test();
