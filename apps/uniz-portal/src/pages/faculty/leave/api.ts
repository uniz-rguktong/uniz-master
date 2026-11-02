const token = () =>
  (
    localStorage.getItem("faculty_token") ||
    localStorage.getItem("admin_token") ||
    ""
  ).replace(/"/g, "");

export async function leaveFetch<T = any>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      ...(init.headers || {}),
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

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  CL: "Casual leave",
  EL: "Earned leave",
  ML: "Medical leave",
  OD: "On duty",
  SCL: "Special casual leave",
};

export const STATUS_LABELS: Record<string, string> = {
  pending_hod: "Waiting for HOD",
  pending_dean: "Waiting for Dean",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const fmtDate = (s: string) => String(s).slice(0, 10);
