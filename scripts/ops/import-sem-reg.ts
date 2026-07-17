import "dotenv/config";
import fs from "fs";
import path from "path";
import prisma from "../../apps/uniz-academics/src/utils/prisma.util";
import {
  importRegistrationRows,
  parseRegistrationFormWorkbook,
  parseSubjectCatalogWorkbook,
  upsertSemesterSubjectCatalog,
} from "../../apps/uniz-academics/src/services/semester-registration-import.service";

type Args = {
  apply: boolean;
  prod: boolean;
  approve: boolean;
  dataDir: string;
  semesterName: string;
  semesterId: string;
  status: "REGISTRATION_OPEN" | "REGISTRATION_CLOSED";
};

const RESPONSE_FILES: Array<{ branch: string; file: string }> = [
  {
    branch: "AIML",
    file: "AY_2026-27 Semester-1 Registration Form AI_ML (Responses).xlsx",
  },
  {
    branch: "CE",
    file: "AY_2026-27 Semester-1 Registration Form CE (Responses).xlsx",
  },
  {
    branch: "CSE",
    file: "AY_2026-27 Semester-1 Registration Form CSE (Responses) (3).xlsx",
  },
  {
    branch: "ECE",
    file: "AY_2026-27 Semester-1 Registration Form ECE (Responses).xlsx",
  },
  {
    branch: "EEE",
    file: "AY_2026-27 Semester-1 Registration Form EEE (Responses).xlsx",
  },
  {
    branch: "ME",
    file: "AY_2026-27 Semester-1 Registration Form ME (Responses).xlsx",
  },
];

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (name: string, fallback: string) => {
    const prefix = `--${name}=`;
    return argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || fallback;
  };
  const status = get("status", "REGISTRATION_CLOSED").toUpperCase();
  if (status !== "REGISTRATION_OPEN" && status !== "REGISTRATION_CLOSED") {
    throw new Error("--status must be REGISTRATION_OPEN or REGISTRATION_CLOSED");
  }
  return {
    apply: argv.includes("--apply"),
    prod: argv.includes("--prod"),
    approve: argv.includes("--approve"),
    dataDir: path.resolve(get("data-dir", "sem-reg")),
    semesterName: get("semester-name", "AY 2026-27 SEM-1"),
    semesterId: get("semester-id", "AY-2026-27-SEM-1").toUpperCase(),
    status,
  };
}

function requireFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
  return fs.readFileSync(filePath);
}

async function main() {
  const args = parseArgs();
  const dryRun = !args.apply;

  if (args.prod && args.apply) {
    if (process.env.SEM_REG_BACKUP_CONFIRMED !== "true") {
      throw new Error(
        "Refusing production apply: set SEM_REG_BACKUP_CONFIRMED=true after taking a DB backup.",
      );
    }
    if (process.env.SEM_REG_PROD_IMPORT_CONFIRMED !== args.semesterId) {
      throw new Error(
        `Refusing production apply: set SEM_REG_PROD_IMPORT_CONFIRMED=${args.semesterId}`,
      );
    }
  }

  console.log(
    `[sem-reg] ${dryRun ? "DRY RUN" : "APPLY"} ${args.prod ? "PROD" : "LOCAL"} ${args.semesterId}`,
  );
  console.log(`[sem-reg] data dir: ${args.dataDir}`);

  const catalogPath = path.join(args.dataDir, "26-27 Subjects Sem-1 (CSE&AIML).xlsx");
  const subjectRows = await parseSubjectCatalogWorkbook(requireFile(catalogPath));

  if (!dryRun) {
    await prisma.academicSemester.upsert({
      where: { id: args.semesterId },
      update: {
        name: args.semesterName,
        academicYear: "AY 2026-27",
        program: "B.Tech",
        status: "DEAN_REVIEW",
      },
      create: {
        id: args.semesterId,
        name: args.semesterName,
        academicYear: "AY 2026-27",
        program: "B.Tech",
        status: "DEAN_REVIEW",
      },
    });
  } else {
    const exists = await prisma.academicSemester.findUnique({
      where: { id: args.semesterId },
    });
    console.log(`[sem-reg] semester exists: ${Boolean(exists)}`);
  }

  const subjectResult = await upsertSemesterSubjectCatalog({
    semesterId: args.semesterId,
    semesterName: args.semesterName,
    rows: subjectRows,
    dryRun,
    approve: args.approve,
  });
  console.log("[sem-reg] subjects", JSON.stringify(subjectResult, null, 2));

  const branchResults: Record<string, unknown> = {};
  for (const item of RESPONSE_FILES) {
    const filePath = path.join(args.dataDir, item.file);
    const rows = await parseRegistrationFormWorkbook(requireFile(filePath), item.branch);
    const result = await importRegistrationRows({
      semesterId: args.semesterId,
      rows,
      mode: "replace",
      dryRun,
      skipValidation: true,
      strict: false,
    });
    branchResults[item.branch] = result;
    console.log(`[sem-reg] ${item.branch}`, JSON.stringify(result, null, 2));
  }

  if (!dryRun) {
    await prisma.academicSemester.update({
      where: { id: args.semesterId },
      data: {
        status: args.status,
        registrationStart: new Date("2026-07-01T00:00:00+05:30"),
        registrationEnd: new Date("2026-07-31T23:59:59+05:30"),
      },
    });
  }

  const registrationCount = await prisma.registration.count({
    where: { semesterId: args.semesterId, status: "REGISTERED" },
  });
  console.log(
    JSON.stringify(
      {
        dryRun,
        prod: args.prod,
        semesterId: args.semesterId,
        finalStatus: dryRun ? "(not changed)" : args.status,
        registrationCountAfterRun: registrationCount,
        branchResults,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("[sem-reg] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
