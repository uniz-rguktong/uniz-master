import { DbAdminError } from "../errors";

export type SqlKind = "empty" | "read" | "write";

export interface ClassifiedSql {
  kind: SqlKind;
  confirmText: string | null;
  statements: string[];
}

type Token = { type: "word"; text: string } | { type: "punct"; text: string };

const READ_AFTER_EXPLAIN = new Set([
  "SELECT",
  "WITH",
  "UPDATE",
  "INSERT",
  "DELETE",
  "TABLE",
  "VALUES",
  "SHOW",
]);

const TX_VERBS = new Set([
  "BEGIN",
  "COMMIT",
  "ROLLBACK",
  "SAVEPOINT",
  "ABORT",
  "START",
  "END",
]);

function skipQuoted(input: string, i: number, quote: string): number {
  let j = i + 1;
  while (j < input.length) {
    if (input[j] === quote && input[j + 1] === quote) {
      j += 2;
      continue;
    }
    if (input[j] === quote) return j + 1;
    j++;
  }
  return input.length;
}

function skipDollar(input: string, i: number): number | null {
  const match = /^\$([A-Za-z0-9_]*)\$/.exec(input.slice(i));
  if (!match) return null;
  const closer = match[0];
  const end = input.indexOf(closer, i + closer.length);
  return end === -1 ? input.length : end + closer.length;
}

function skipComment(input: string, i: number): number | null {
  if (input[i] === "-" && input[i + 1] === "-") {
    let j = i + 2;
    while (j < input.length && input[j] !== "\n") j++;
    return j;
  }
  if (input[i] === "/" && input[i + 1] === "*") {
    let j = i + 2;
    while (j < input.length && !(input[j] === "*" && input[j + 1] === "/")) j++;
    return Math.min(input.length, j + 2);
  }
  return null;
}

export function splitSql(input: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let i = 0;
  while (i < input.length) {
    const comment = skipComment(input, i);
    if (comment !== null) {
      i = comment;
      continue;
    }
    const c = input[i];
    if (c === "'" || c === '"') {
      i = skipQuoted(input, i, c);
      continue;
    }
    if (c === "$") {
      const next = skipDollar(input, i);
      if (next !== null) {
        i = next;
        continue;
      }
    }
    if (c === ";") {
      const piece = input.slice(start, i).trim();
      if (piece) parts.push(piece);
      i++;
      start = i;
      continue;
    }
    i++;
  }
  const tail = input.slice(start).trim();
  if (tail) parts.push(tail);
  return parts;
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === " " || ch === "\n" || ch === "\r" || ch === "\t" || ch === "\f") {
      i++;
      continue;
    }
    const comment = skipComment(input, i);
    if (comment !== null) {
      i = comment;
      continue;
    }
    if (ch === "'" || ch === '"') {
      i = skipQuoted(input, i, ch);
      continue;
    }
    if (ch === "$") {
      const next = skipDollar(input, i);
      if (next !== null) {
        i = next;
        continue;
      }
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < input.length && /[A-Za-z0-9_$]/.test(input[j])) j++;
      tokens.push({ type: "word", text: input.slice(i, j) });
      i = j;
      continue;
    }
    if (ch === "(" || ch === ")" || ch === "," || ch === ";") {
      tokens.push({ type: "punct", text: ch });
    }
    i++;
  }
  return tokens;
}

function skipParens(tokens: Token[], index: number): number {
  if (tokens[index]?.text !== "(") return index;
  let depth = 0;
  for (let j = index; j < tokens.length; j++) {
    if (tokens[j].text === "(") depth++;
    else if (tokens[j].text === ")") {
      depth--;
      if (depth === 0) return j + 1;
    }
  }
  return tokens.length;
}

export function mainVerb(sql: string): string {
  const tokens = tokenize(sql);
  let i = 0;
  const word = () => (tokens[i] ? tokens[i].text.toUpperCase() : "");

  if (word() === "WITH") {
    i++;
    if (word() === "RECURSIVE") i++;
    while (i < tokens.length) {
      if (tokens[i]?.type !== "word") break;
      i++;
      if (word() === "(") i = skipParens(tokens, i);
      if (word() !== "AS") break;
      i++;
      if (word() === "NOT") i++;
      if (word() === "MATERIALIZED") i++;
      if (word() !== "(") break;
      i = skipParens(tokens, i);
      if (word() === ",") {
        i++;
        continue;
      }
      break;
    }
  }
  return word();
}

function selectWrites(tokens: Token[]): boolean {
  let depth = 0;
  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.text === "(") depth++;
    else if (token.text === ")") depth--;
    else if (depth === 0 && token.type === "word" && token.text.toUpperCase() === "INTO") {
      return true;
    }
  }
  return false;
}

function explainWrites(tokens: Token[]): boolean {
  let depth = 0;
  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.text === "(") depth++;
    else if (token.text === ")") depth = Math.max(0, depth - 1);
    else if (token.type === "word" && token.text.toUpperCase() === "ANALYZE") return true;
    else if (
      depth === 0 &&
      token.type === "word" &&
      READ_AFTER_EXPLAIN.has(token.text.toUpperCase())
    ) {
      return false;
    }
  }
  return false;
}

function isRead(sql: string): boolean {
  const verb = mainVerb(sql);
  const tokens = tokenize(sql);
  if (verb === "SELECT") return !selectWrites(tokens);
  if (verb === "TABLE" || verb === "VALUES" || verb === "SHOW") return true;
  if (verb === "EXPLAIN") return !explainWrites(tokens);
  return false;
}

function isEscalation(sql: string): boolean {
  const words = tokenize(sql)
    .filter((token) => token.type === "word")
    .map((token) => token.text.toUpperCase());
  const first = words[0] || "";
  const second = words[1] || "";
  const third = words[2] || "";
  if (first === "SET" && second === "ROLE") return true;
  if (first === "SET" && second === "SESSION" && third === "AUTHORIZATION") return true;
  if ((first === "ALTER" || first === "CREATE" || first === "DROP") && (second === "ROLE" || second === "USER")) {
    return true;
  }
  return false;
}

export function targetsAuditTable(sql: string): boolean {
  const bare = sql.toLowerCase().replace(/"/g, "");
  return /uniz_dbadmin\s*\.\s*changes\b/.test(bare) || /uniz_dbadmin\s*\.\s*requests\b/.test(bare);
}

export function classifySql(raw: string): ClassifiedSql {
  const statements = splitSql(raw).filter((statement) =>
    tokenize(statement).some((token) => token.type === "word"),
  );
  if (statements.length === 0) {
    return { kind: "empty", confirmText: null, statements: [] };
  }

  let writeVerb: string | null = null;
  for (const statement of statements) {
    if (isEscalation(statement)) {
      throw new DbAdminError(
        400,
        "That command would change database logins. The editor cannot do that.",
      );
    }
    const verb = mainVerb(statement);
    if (!verb) {
      throw new DbAdminError(400, "The editor could not read that command.");
    }
    if (TX_VERBS.has(verb)) {
      throw new DbAdminError(
        400,
        "Do not start or finish a transaction yourself. The editor already wraps the command in one.",
      );
    }
    if (!isRead(statement)) writeVerb = verb;
    if (writeVerb && targetsAuditTable(statement)) {
      throw new DbAdminError(400, "The history tables cannot be edited. They only grow.");
    }
  }

  if (writeVerb) {
    return { kind: "write", confirmText: writeVerb, statements };
  }
  return { kind: "read", confirmText: null, statements };
}

export function confirmationSatisfied(required: string | null, given: unknown): boolean {
  if (required === null) return true;
  return typeof given === "string" && given.trim() === required;
}
