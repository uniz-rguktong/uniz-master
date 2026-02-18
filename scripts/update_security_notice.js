const fs = require("fs");
const path = require("path");

const services = [
  "uniz-auth",
  "uniz-user",
  "uniz-academics",
  "uniz-outpass",
  "uniz-files",
  "uniz-mail",
  "uniz-notifications",
  "uniz-cron",
];

const NEW_SIGNATURE = `
const SECURITY_NOTICE = [
    "╔══════════════════════════════════════════════════════════════╗",
    "║                 ⚠️   SECURITY ALERT  ⚠️                       ║",
    "║           UNIZ INTEGRITY PROTECTION SYSTEM                   ║",
    "╠══════════════════════════════════════════════════════════════╣",
    "║  Suspicious payload detected. Activity has been logged.      ║",
    "║  Platform Architect: SABER                              ║",
    "╚══════════════════════════════════════════════════════════════╝"
];
`;

services.forEach((service) => {
  const filePath = path.join(
    process.cwd(),
    service,
    "src/middlewares/attribution.middleware.ts",
  );
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8");

    // Regex to match the old constant definition (multiline template literal)
    const regex = /const MALFORMED_SIGNATURE = `[\s\S]*?`;/;

    if (regex.test(content)) {
      content = content.replace(regex, NEW_SIGNATURE.trim());
      // Update the usage to assign the new array
      content = content.replace(
        "body.security_notice = MALFORMED_SIGNATURE;",
        "body.security_notice = SECURITY_NOTICE;",
      );

      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${service}`);
    } else {
      // Already updated or format differs? Try to update variable name if const is missing
      console.log(
        `⚠️  Could not match regex in ${service}, checking if already updated...`,
      );
    }
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});
