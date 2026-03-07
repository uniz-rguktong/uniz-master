const { PrismaClient } = require("../src/lib/generated/client");
const p = new PrismaClient();
p.event
  .findMany({ select: { id: true, status: true }, take: 5 })
  .then((r) => console.log(r))
  .catch((e) => console.error(e.message))
  .finally(() => p.$disconnect());
