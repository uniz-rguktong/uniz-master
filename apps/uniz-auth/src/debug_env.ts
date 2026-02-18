import dotenv from "dotenv";
dotenv.config();

console.log("DEBUG: DATABASE_URL loaded:", process.env.DATABASE_URL);

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

console.log(
  "DEBUG: Prisma Datasource:",
  // @ts-ignore
  prisma._engineConfig?.datasources?.[0]?.url?.value || "Hidden",
);
