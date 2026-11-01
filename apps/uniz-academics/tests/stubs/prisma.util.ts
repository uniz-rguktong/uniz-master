import { vi } from "vitest";

export type PrismaMode = "empty" | "rich";

type MockFn = ReturnType<typeof vi.fn>;

const fns = new Map<string, MockFn>();
let mode: PrismaMode = "empty";

const subject = {
  id: "sub-1",
  code: "CS2001",
  name: "Data Structures",
  credits: 4,
  department: "CSE",
  semester: "E2-SEM-1",
  subjectType: "CORE",
};

const catalogSubject = {
  id: "sub-e1",
  code: "CS-E1-101",
  name: "Intro to Computing",
  credits: 3,
  department: "CSE",
  semester: "SEM-1",
  subjectType: "CORE",
};

const semester = {
  id: "E2-SEM-1",
  name: "E2 Semester 1",
  status: "REGISTRATION_OPEN",
  academicYear: "E2",
  batch: "O21",
  branch: "CSE",
  program: "B.Tech",
  registrationStart: new Date("2020-01-01T00:00:00.000Z"),
  registrationEnd: new Date("2099-01-01T00:00:00.000Z"),
  semesterStart: new Date("2024-01-01T00:00:00.000Z"),
  semesterEnd: new Date("2024-06-01T00:00:00.000Z"),
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-06-01T00:00:00.000Z"),
};

const gradePass = {
  id: "grade-1",
  studentId: "O210008",
  subjectId: "sub-1",
  semesterId: "E2-SEM-1",
  grade: 9,
  attemptNumber: 1,
  isRemedial: false,
  batch: "O21",
  subjectCode: "CS2001",
  subjectName: "Data Structures",
  subject,
  passDate: new Date("2024-06-01T00:00:00.000Z"),
  createdAt: new Date("2024-06-01T00:00:00.000Z"),
  updatedAt: new Date("2024-06-01T00:00:00.000Z"),
};

const gradeFail = {
  ...gradePass,
  id: "grade-0",
  grade: 0,
  attemptNumber: 3,
  isRemedial: true,
};

const attendanceOk = {
  id: "att-1",
  studentId: "O210008",
  subjectId: "sub-1",
  semesterId: "E2-SEM-1",
  totalClasses: 10,
  attendedClasses: 8,
  batch: "O21",
  subject,
};

const attendanceLow = {
  ...attendanceOk,
  id: "att-2",
  studentId: "O210009",
  attendedClasses: 2,
};

const allocation = {
  id: "alloc-1",
  semesterId: "E2-SEM-1",
  subjectId: "sub-1",
  branch: "CSE",
  academicYear: "E2",
  batch: "O21",
  isMandatory: true,
  isApproved: true,
  status: "APPROVED",
  electiveGroupId: null as string | null,
  electiveGroupName: null as string | null,
  electiveLimit: null as number | null,
  customCode: "CS2001",
  customName: "Data Structures",
  customCredits: 4,
  subjectType: "CORE",
  subject,
  semester,
};

const registration = {
  id: "reg-1",
  studentId: "O210008",
  subjectId: "sub-1",
  semesterId: "E2-SEM-1",
  status: "REGISTERED",
  batch: "O21",
  subject,
  createdAt: new Date("2024-06-01T00:00:00.000Z"),
  submittedAt: new Date("2024-06-01T00:00:00.000Z"),
};

const faculty = {
  id: "fac-1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  department: "CSE",
  role: "FACULTY",
  photo: null,
  bio: {},
  designation: "Professor",
};

const electiveGroup = {
  id: "grp-1",
  semesterId: "E2-SEM-1",
  branch: "CSE",
  academicYear: "E2",
  groupCode: "PE1",
  groupName: "Professional Elective 1",
  selectionLimit: 1,
};

const seating = {
  id: "seat-1",
  studentId: "O210008",
  subjectId: "sub-1",
  semesterId: "E2-SEM-1",
  examName: "MID-1",
  room: "A1",
  seatNumber: "12",
  date: new Date("2024-03-01T00:00:00.000Z"),
  time: "10:00",
  subject,
};

const lists: Record<string, any[]> = {
  academicSemester: [semester],
  subject: [subject, catalogSubject],
  grade: [gradePass, gradeFail],
  attendance: [attendanceOk, attendanceLow],
  branchAllocation: [allocation],
  registration: [registration],
  faculty: [faculty],
  electiveGroup: [electiveGroup],
  seatingArrangement: [seating],
};

function rowsFor(model: string) {
  return lists[model] || [{ id: `${model}-1` }];
}

function dispatch(model: string, name: string, args: any[]) {
  const data = args[0]?.data || {};
  if (mode === "empty") {
    if (name === "findMany" || name === "groupBy") return [];
    if (name === "findUnique" || name === "findFirst") return null;
    if (name === "count") return 0;
    if (name === "aggregate") {
      return { _avg: { grade: null }, _count: { id: 0, _all: 0 }, _sum: {} };
    }
    if (name === "deleteMany" || name === "updateMany" || name === "createMany") {
      return { count: 0 };
    }
    if (
      name === "create" ||
      name === "update" ||
      name === "upsert" ||
      name === "delete"
    ) {
      return { id: `${model}-1`, ...data };
    }
    return null;
  }

  if (name === "groupBy") {
    return [{ studentId: "O210008", _count: { _all: 1 } }];
  }
  if (name === "findMany") return rowsFor(model);
  if (name === "findUnique" || name === "findFirst") {
    return rowsFor(model)[0] ?? null;
  }
  if (name === "count") return 0;
  if (name === "aggregate") {
    return {
      _avg: { grade: 8.5 },
      _count: { id: 3, _all: 3 },
      _sum: { credits: 4, attendedClasses: 10, totalClasses: 20 },
    };
  }
  if (name === "deleteMany" || name === "updateMany" || name === "createMany") {
    return { count: 1 };
  }
  if (
    name === "create" ||
    name === "update" ||
    name === "upsert" ||
    name === "delete"
  ) {
    const base = rowsFor(model)[0] || { id: `${model}-1` };
    return { ...base, ...data, id: data.id || base.id };
  }
  return null;
}

function method(model: string, name: string): MockFn {
  const key = `${model}.${name}`;
  let fn = fns.get(key);
  if (!fn) {
    fn = vi.fn((...args: any[]) => Promise.resolve(dispatch(model, name, args)));
    fns.set(key, fn);
  }
  return fn;
}

const queryRaw = vi.fn(async () =>
  mode === "rich"
    ? [{ department: "CSE", avg_grade: 8.2, student_count: 4 }]
    : [],
);
const queryRawUnsafe = vi.fn(async () =>
  mode === "rich"
    ? [{ department: "CSE", avg_grade: 8.2, student_count: 4 }]
    : [],
);
const executeRaw = vi.fn(async () => (mode === "rich" ? 1 : 0));
const connectFn = vi.fn(async () => undefined);

function modelProxy(model: string) {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop !== "string") return undefined;
        return method(model, prop);
      },
    },
  );
}

const prisma: any = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === "then") return undefined;
      if (prop === "$transaction") return transactionFn;
      if (prop === "$queryRaw") return queryRaw;
      if (prop === "$queryRawUnsafe") return queryRawUnsafe;
      if (prop === "$executeRaw" || prop === "$executeRawUnsafe") return executeRaw;
      if (prop === "$connect" || prop === "$disconnect") return connectFn;
      if (typeof prop !== "string") return undefined;
      return modelProxy(prop);
    },
  },
);

const transactionFn = vi.fn(async (arg: any) => {
  if (typeof arg === "function") return arg(prisma);
  if (Array.isArray(arg)) return Promise.all(arg);
  return arg;
});

export function setPrismaMode(next: PrismaMode) {
  mode = next;
  for (const [key, fn] of fns) {
    const dot = key.indexOf(".");
    const model = key.slice(0, dot);
    const name = key.slice(dot + 1);
    fn.mockReset();
    fn.mockImplementation((...args: any[]) =>
      Promise.resolve(dispatch(model, name, args)),
    );
  }
  queryRaw.mockReset();
  queryRawUnsafe.mockReset();
  queryRaw.mockImplementation(async () =>
    mode === "rich"
      ? [{ department: "CSE", avg_grade: 8.2, student_count: 4 }]
      : [],
  );
  queryRawUnsafe.mockImplementation(async () =>
    mode === "rich"
      ? [{ department: "CSE", avg_grade: 8.2, student_count: 4 }]
      : [],
  );
  transactionFn.mockReset();
  transactionFn.mockImplementation(async (arg: any) => {
    if (typeof arg === "function") return arg(prisma);
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg;
  });
}

export function currentPrismaMode() {
  return mode;
}

export default prisma;
