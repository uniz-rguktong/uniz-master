const fs = require("fs");
const path = require("path");

const ownerServices = [
  "uniz-user",
  "uniz-auth",
  "uniz-academics",
  "uniz-outpass",
];
const outputFile = ".monolith.prisma";

// Use uniz-user as the template for the header
const userSchema = fs.readFileSync("uniz-user/prisma/schema.prisma", "utf8");
const headerMatch = userSchema.match(/^.*?(model|enum|type)/s);
let masterSchema = headerMatch
  ? headerMatch[0].replace(/(model|enum|type)$/, "")
  : userSchema;

const seenModels = new Set();

ownerServices.forEach((service) => {
  const schemaPath = path.join(service, "prisma", "schema.prisma");
  if (!fs.existsSync(schemaPath)) return;

  const content = fs.readFileSync(schemaPath, "utf8");
  const blocks = content.match(/(model|enum|type)\s+\w+\s+\{[^}]*\}/gs);

  if (blocks) {
    blocks.forEach((block) => {
      const match = block.match(/(model|enum|type)\s+(\w+)/);
      if (match) {
        const name = match[2];
        if (!seenModels.has(name)) {
          masterSchema += block + "\n\n";
          seenModels.add(name);
        }
      }
    });
  }
});

fs.writeFileSync(outputFile, masterSchema);
console.log(
  `Successfully created union schema with ${seenModels.size} unique models/enums.`,
);
