/** Fetch helper for module pages. kind "student" uses student_token, "staff" faculty or admin token. */
export async function modFetch<T = any>(
  url: string,
  init: RequestInit = {},
  kind: "student" | "staff" = "staff",
): Promise<T> {
  const raw =
    kind === "student"
      ? localStorage.getItem("student_token")
      : localStorage.getItem("faculty_token") ||
        localStorage.getItem("admin_token");
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${(raw || "").replace(/"/g, "")}`,
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
export const post = (body?: unknown): RequestInit => ({
  method: "POST",
  body: body ? JSON.stringify(body) : undefined,
});
export const day = (d?: string | null) => (d ? String(d).slice(0, 10) : "");
export const inputCls =
  "rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none";
export const btnCls = "rounded-md bg-navy-900 px-3 py-1.5 text-sm text-white";
export const cardCls =
  "rounded-lg border border-slate-200 bg-white p-3 text-sm";
