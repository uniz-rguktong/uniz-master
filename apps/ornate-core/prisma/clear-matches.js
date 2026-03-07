const { PrismaClient } = require("../src/lib/generated/client");
const p = new PrismaClient();
p.$executeRawUnsafe('DELETE FROM "Match"')
  .then((r) => console.log("Deleted matches:", r))
  .catch((e) => console.error(e.message))
  .finally(() => p.$disconnect());
