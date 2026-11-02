import axios from "axios";
import {
  isFeatureEnabled,
  resolveEffectiveRole,
  PAYMENTS_DISABLED_REASON,
} from "@uniz/shared";
import prisma from "../utils/prisma";

export const STAFF_ROLES = ["librarian", "webadmin", "director"];
export const FACULTY_ROLES = ["faculty", "teacher", "hod"];
export const POLICY = {
  student: { loanDays: 14, maxLoans: 3 },
  faculty: { loanDays: 30, maxLoans: 10 },
  finePerDayPaise: 100,
  remindBeforeDays: 2,
};
export const MAX_IMPORT_ROWS = 1000;
const DAY = 24 * 60 * 60 * 1000;

export type Actor = { id?: string; username: string; role?: string };

export class LibraryError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const libraryEnabled = () => isFeatureEnabled("FEATURE_LIBRARY");
export const isStaff = (a: Actor) =>
  STAFF_ROLES.includes(resolveEffectiveRole(a));
function requireStaff(a: Actor) {
  if (!isStaff(a))
    throw new LibraryError(403, "FORBIDDEN", "Only library staff can do this");
}

export const overdueDays = (due: Date, at: Date = new Date()) =>
  Math.max(0, Math.floor((at.getTime() - new Date(due).getTime()) / DAY));
export const fineFor = (due: Date, at: Date = new Date()) =>
  overdueDays(due, at) * POLICY.finePerDayPaise;

/** Small CSV parser (quotes, commas, CRLF). No new deps. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      row.push(cur);
      cur = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cur = "";
    } else cur += ch;
  }
  row.push(cur);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows.map((r) => r.map((c) => c.trim()));
}

export async function searchBooks(q: string | undefined) {
  const where: any = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { author: { contains: q, mode: "insensitive" } },
          { isbn: q },
        ],
      }
    : {};
  const books: any[] = await prisma.book.findMany({
    where,
    orderBy: { title: "asc" },
    take: 100,
  });
  if (books.length === 0) return [];
  const copies: any[] = await prisma.bookCopy.findMany({
    where: { bookId: { in: books.map((b) => b.id) } },
    select: { bookId: true, status: true },
  });
  return books.map((b) => {
    const mine = copies.filter((c) => c.bookId === b.id);
    return {
      ...b,
      copies: mine.length,
      available: mine.filter((c) => c.status === "available").length,
    };
  });
}

export type BookInput = {
  title: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  year?: string;
  category?: string;
  barcodes: string[];
  shelf?: string;
};

async function findOrCreateBook(actor: Actor, b: BookInput) {
  const existing = b.isbn
    ? await prisma.book.findFirst({ where: { isbn: b.isbn } })
    : await prisma.book.findFirst({
        where: { title: b.title, author: b.author || "" },
      });
  if (existing) return existing;
  return prisma.book.create({
    data: {
      title: b.title,
      author: b.author || "",
      isbn: b.isbn || "",
      publisher: b.publisher || "",
      year: b.year || "",
      category: b.category || "",
      createdBy: actor.username,
    },
  });
}

export async function addBook(actor: Actor, b: BookInput) {
  requireStaff(actor);
  const book: any = await findOrCreateBook(actor, b);
  const r: any = await prisma.bookCopy.createMany({
    data: b.barcodes.map((barcode) => ({
      bookId: book.id,
      barcode,
      shelf: b.shelf || "",
    })),
    skipDuplicates: true,
  });
  return { book, copiesAdded: r?.count ?? 0 };
}

/** CSV header: title,author,isbn,publisher,year,category,barcode,shelf. One row per copy. */
export async function importCsv(actor: Actor, csv: string) {
  requireStaff(actor);
  const rows = parseCsv(csv);
  if (rows.length < 2)
    throw new LibraryError(
      400,
      "VALIDATION_ERROR",
      "CSV needs a header and at least one row",
    );
  const head = rows[0].map((h) => h.toLowerCase());
  const col = (n: string) => head.indexOf(n);
  if (col("title") < 0 || col("barcode") < 0) {
    throw new LibraryError(
      400,
      "VALIDATION_ERROR",
      "CSV must have title and barcode columns",
    );
  }
  const body = rows.slice(1);
  if (body.length > MAX_IMPORT_ROWS) {
    throw new LibraryError(
      400,
      "VALIDATION_ERROR",
      `At most ${MAX_IMPORT_ROWS} rows per import`,
    );
  }
  const get = (r: string[], n: string) => (col(n) >= 0 ? r[col(n)] || "" : "");
  const groups = new Map<string, BookInput>();
  const errors: string[] = [];
  body.forEach((r, i) => {
    const title = get(r, "title");
    const barcode = get(r, "barcode");
    if (!title || !barcode) {
      errors.push(`Row ${i + 2}: title and barcode are required`);
      return;
    }
    const isbn = get(r, "isbn");
    const author = get(r, "author");
    const key = isbn || `${title}|${author}`;
    const g = groups.get(key) || {
      title,
      author,
      isbn,
      publisher: get(r, "publisher"),
      year: get(r, "year"),
      category: get(r, "category"),
      shelf: get(r, "shelf"),
      barcodes: [],
    };
    g.barcodes.push(barcode);
    groups.set(key, g);
  });
  let books = 0;
  let copies = 0;
  for (const g of groups.values()) {
    const r = await addBook(actor, g);
    books++;
    copies += r.copiesAdded;
  }
  return {
    rows: body.length,
    books,
    copiesAdded: copies,
    skipped: body.length - copies,
    errors: errors.slice(0, 50),
  };
}

async function findBorrower(username: string) {
  const variants = Array.from(
    new Set([username, username.toUpperCase(), username.toLowerCase()]),
  );
  const st: any = await prisma.studentProfile.findFirst({
    where: { username: { in: variants } },
    select: { username: true, isSuspended: true },
  });
  if (st) {
    if (st.isSuspended)
      throw new LibraryError(409, "SUSPENDED", "This student is suspended");
    return { username: st.username as string, type: "student" as const };
  }
  const f: any = await prisma.facultyProfile.findFirst({
    where: { username: { in: variants } },
    select: { username: true },
  });
  if (f) return { username: f.username as string, type: "faculty" as const };
  throw new LibraryError(
    404,
    "NOT_FOUND",
    "No student or faculty with that username",
  );
}

export async function issue(
  actor: Actor,
  input: { barcode: string; username: string },
) {
  requireStaff(actor);
  const copy: any = await prisma.bookCopy.findUnique({
    where: { barcode: input.barcode },
  });
  if (!copy)
    throw new LibraryError(404, "NOT_FOUND", "No copy with that barcode");
  if (copy.status !== "available")
    throw new LibraryError(409, "NOT_AVAILABLE", `This copy is ${copy.status}`);
  const who = await findBorrower(input.username);
  const p = POLICY[who.type];
  const active = await prisma.loan.count({
    where: { borrowerUsername: who.username, returnedAt: null },
  });
  if (active >= p.maxLoans)
    throw new LibraryError(
      409,
      "LIMIT_REACHED",
      `Borrow limit is ${p.maxLoans} books`,
    );
  const unpaid = await prisma.libraryFine.count({
    where: { username: who.username, status: "unpaid" },
  });
  if (unpaid > 0)
    throw new LibraryError(
      409,
      "FINE_DUE",
      "Borrower has an unpaid library fine",
    );
  const claimed: any = await prisma.bookCopy.updateMany({
    where: { id: copy.id, status: "available" },
    data: { status: "issued" },
  });
  if (!claimed?.count)
    throw new LibraryError(409, "NOT_AVAILABLE", "This copy was just issued");
  const loan = await prisma.loan.create({
    data: {
      copyId: copy.id,
      bookId: copy.bookId,
      borrowerUsername: who.username,
      borrowerType: who.type,
      dueDate: new Date(Date.now() + p.loanDays * DAY),
      issuedBy: actor.username,
    },
  });
  return loan;
}

export async function returnCopy(
  actor: Actor,
  barcode: string,
  at: Date = new Date(),
) {
  requireStaff(actor);
  const copy: any = await prisma.bookCopy.findUnique({ where: { barcode } });
  if (!copy)
    throw new LibraryError(404, "NOT_FOUND", "No copy with that barcode");
  const loan: any = await prisma.loan.findFirst({
    where: { copyId: copy.id, returnedAt: null },
  });
  if (!loan)
    throw new LibraryError(409, "NOT_ISSUED", "This copy is not on loan");
  const updated = await prisma.loan.update({
    where: { id: loan.id },
    data: { returnedAt: at, returnedTo: actor.username },
  });
  await prisma.bookCopy.update({
    where: { id: copy.id },
    data: { status: "available" },
  });
  const amount = fineFor(loan.dueDate, at);
  let fine = null;
  if (amount > 0) {
    fine = await prisma.libraryFine.create({
      data: {
        loanId: loan.id,
        username: loan.borrowerUsername,
        amountPaise: amount,
        note: `${overdueDays(loan.dueDate, at)} days late`,
      },
    });
  }
  return { loan: updated, fine };
}

export async function listLoans(
  actor: Actor,
  status: "active" | "overdue" | "returned" = "active",
) {
  requireStaff(actor);
  const where: any =
    status === "returned"
      ? { returnedAt: { not: null } }
      : status === "overdue"
        ? { returnedAt: null, dueDate: { lt: new Date() } }
        : { returnedAt: null };
  return prisma.loan.findMany({
    where,
    orderBy: { dueDate: "asc" },
    take: 500,
  });
}

export async function myLibrary(actor: Actor) {
  const variants = Array.from(
    new Set([
      actor.username,
      actor.username.toUpperCase(),
      actor.username.toLowerCase(),
    ]),
  );
  const [loans, fines]: any[] = await Promise.all([
    prisma.loan.findMany({
      where: { borrowerUsername: { in: variants } },
      orderBy: { issuedAt: "desc" },
      take: 100,
    }),
    prisma.libraryFine.findMany({
      where: { username: { in: variants } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const ids: string[] = Array.from(
    new Set(loans.map((l: any) => String(l.bookId))),
  );
  const books: any[] = ids.length
    ? await prisma.book.findMany({
        where: { id: { in: ids } },
        select: { id: true, title: true, author: true },
      })
    : [];
  const byId = new Map(books.map((b) => [b.id, b]));
  return {
    loans: loans.map((l: any) => ({
      ...l,
      book: byId.get(l.bookId) || null,
      accruingFinePaise: l.returnedAt ? 0 : fineFor(l.dueDate),
    })),
    fines,
    finePayment: { enabled: false, reason: PAYMENTS_DISABLED_REASON },
  };
}

export async function listFines(actor: Actor, status?: string) {
  requireStaff(actor);
  return prisma.libraryFine.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

/** Mark a fine paid at the counter or waived. */
export async function settleFine(
  actor: Actor,
  id: string,
  action: "paid" | "waived",
  note?: string,
) {
  requireStaff(actor);
  const f: any = await prisma.libraryFine.findUnique({ where: { id } });
  if (!f) throw new LibraryError(404, "NOT_FOUND", "Fine not found");
  if (f.status !== "unpaid")
    throw new LibraryError(
      409,
      "ALREADY_SETTLED",
      `Fine is already ${f.status}`,
    );
  return prisma.libraryFine.update({
    where: { id },
    data: {
      status: action,
      note: [f.note, note, `by ${actor.username}`].filter(Boolean).join("; "),
    },
  });
}

const NOTIFICATION_SERVICE_URL = (
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-notification-service:3007"
    : process.env.NOTIFICATION_SERVICE_URL) || "http://localhost:3007"
).replace(/\/$/, "");

/** Push + inbox entry through the notification service. Failures are logged, never thrown. */
async function notify(username: string, title: string, body: string) {
  try {
    await axios.post(
      `${NOTIFICATION_SERVICE_URL}/push/send`,
      { target: "user", username, title, body },
      {
        headers: {
          "x-internal-secret": (
            process.env.INTERNAL_SECRET || "uniz-core"
          ).trim(),
        },
        timeout: 5000,
      },
    );
    return true;
  } catch (e: any) {
    console.error(`[Library] reminder to ${username} failed:`, e?.message);
    return false;
  }
}

/** Reminds borrowers with books due soon or overdue, at most once a day each loan. */
export async function sendReminders(actor: Actor, now: Date = new Date()) {
  requireStaff(actor);
  const loans: any[] = await prisma.loan.findMany({
    where: {
      returnedAt: null,
      dueDate: { lt: new Date(now.getTime() + POLICY.remindBeforeDays * DAY) },
      OR: [
        { remindedAt: null },
        { remindedAt: { lt: new Date(now.getTime() - DAY) } },
      ],
    },
    take: 500,
  });
  let sent = 0;
  for (const l of loans) {
    const late = overdueDays(l.dueDate, now);
    const due = new Date(l.dueDate).toISOString().slice(0, 10);
    const ok = await notify(
      l.borrowerUsername,
      late > 0 ? "Library book overdue" : "Library book due soon",
      late > 0
        ? `A library book was due on ${due}. Fine so far: Rs ${(fineFor(l.dueDate, now) / 100).toFixed(2)}.`
        : `A library book is due on ${due}. Please return or renew it.`,
    );
    if (ok) {
      sent++;
      await prisma.loan.update({
        where: { id: l.id },
        data: { remindedAt: now },
      });
    }
  }
  return { due: loans.length, sent };
}
