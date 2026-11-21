import { DbAdminError } from "../errors";

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function quoteIdent(name: string): string {
  if (!IDENT.test(name)) {
    throw new DbAdminError(400, "That table or column name cannot be used.");
  }
  return `"${name}"`;
}

export function quoteQualified(schema: string, table: string): string {
  return `${quoteIdent(schema)}.${quoteIdent(table)}`;
}
