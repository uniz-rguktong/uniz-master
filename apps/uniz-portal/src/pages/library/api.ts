/** Library calls work for students (student_token) and staff or faculty (faculty_token, admin_token). */
const token = (kind: "student" | "staff") =>
  (
    (kind === "student"
      ? localStorage.getItem("student_token")
      : localStorage.getItem("faculty_token") ||
        localStorage.getItem("admin_token")) || ""
  ).replace(/"/g, "");

export async function libraryFetch<T = any>(
  url: string,
  init: RequestInit = {},
  kind: "student" | "staff" = "staff",
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token(kind)}`,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(
      body?.message || `Request failed (${res.status})`,
    );
    err.status = res.status;
    err.code = body?.code;
    throw err;
  }
  return body as T;
}

export const rupees = (paise: number) =>
  `Rs ${(Number(paise || 0) / 100).toFixed(2)}`;
export const day = (d: string | null | undefined) =>
  d ? String(d).slice(0, 10) : "";
