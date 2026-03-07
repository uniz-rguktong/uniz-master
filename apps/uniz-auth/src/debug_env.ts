import dotenv from "dotenv";
dotenv.config();

import { prisma } from "./utils/prisma";

console.log("DEBUG: DATABASE_URL loaded:", process.env.DATABASE_URL);

console.log(
  "DEBUG: Prisma Datasource:",
  // @ts-ignore
  prisma._engineConfig?.datasources?.[0]?.url?.value || "Hidden",
);
