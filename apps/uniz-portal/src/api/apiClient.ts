import { toast } from "@/utils/toast-ref";
import { ANALYTICS_KEY } from "./endpoints";

export enum ErrorCode {
  AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED",
  AUTH_FORBIDDEN = "AUTH_FORBIDDEN",
  AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED",
  AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  OUTPASS_EXPIRED = "OUTPASS_EXPIRED",
  OUTPASS_ALREADY_APPROVED = "OUTPASS_ALREADY_APPROVED",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  AUTH_SUSPENDED = "AUTH_SUSPENDED",
  AUTH_CAPTCHA_FAILED = "AUTH_CAPTCHA_FAILED",
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  errors?: any[];
}

export interface ApiOptions extends RequestInit {
  params?: Record<string, any>;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      message: string;
      code?: string;
      errors?: Array<{ row?: number; studentId?: string; field?: string; message: string }>;
      errorCount?: number;
    };

export async function apiClient<T = any>(
  endpoint: string,
  options: ApiOptions = {},
  showToast = true,
): Promise<T | null> {
  const token =
    localStorage.getItem("admin_token") ||
    localStorage.getItem("faculty_token") ||
    localStorage.getItem("student_token");
  const cleanToken = token ? token.replace(/^"|"$/g, "") : null;

  const isFormData = options.body instanceof FormData;

  const defaultHeaders: Record<string, string> = {
    ...(cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {}),
    ...(ANALYTICS_KEY ? { "x-api-key": ANALYTICS_KEY } : {}),
  };

  if (!isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  // Handle Query Parameters
  let url = endpoint;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      handleHttpError(
        response.status,
        { message: "Unexpected response format (Expected JSON)" },
        showToast,
      );
      return null;
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      handleHttpError(response.status, data, showToast, url);
      return null;
    }

    return (data.data || data) as T;
  } catch (error: any) {
    if (showToast) {
      toast.error(
        error.message ||
          "Network connection error. Please check your internet.",
      );
    }
    return null;
  }
}

/** Like apiClient but returns structured success/failure for forms that need inline errors. */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiOptions = {},
  showToast = false,
): Promise<ApiResult<T>> {
  const token =
    localStorage.getItem("admin_token") ||
    localStorage.getItem("faculty_token") ||
    localStorage.getItem("student_token");
  const cleanToken = token ? token.replace(/^"|"$/g, "") : null;
  const isFormData = options.body instanceof FormData;

  const defaultHeaders: Record<string, string> = {
    ...(cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {}),
    ...(ANALYTICS_KEY ? { "x-api-key": ANALYTICS_KEY } : {}),
  };
  if (!isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  let url = endpoint;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const message = "Unexpected response format (Expected JSON)";
      if (showToast) handleHttpError(response.status, { message }, true, url);
      return { ok: false, status: response.status, message };
    }

    const data: ApiResponse<T> = await response.json();
    if (!response.ok) {
      const message = extractApiErrorMessage(data);
      if (showToast) handleHttpError(response.status, data, true, url);
      return {
        ok: false,
        status: response.status,
        message,
        code: data.code || (data as any).error?.code,
        errors: (data as any).errors,
        errorCount: (data as any).errorCount,
      };
    }

    return { ok: true, data: (data.data || data) as T };
  } catch (error: any) {
    const message =
      error.message || "Network connection error. Please check your internet.";
    if (showToast) toast.error(message);
    return { ok: false, status: 0, message };
  }
}

function extractApiErrorMessage(data: any): string {
  if (typeof data?.error === "string" && data.error.trim()) return data.error;
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  if (typeof data?.msg === "string" && data.msg.trim()) return data.msg;
  if (typeof data?.error?.message === "string") return data.error.message;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const preview = data.errors
      .slice(0, 5)
      .map((e: any) => e.message)
      .filter(Boolean)
      .join(" ");
    return preview || "Upload rejected due to validation errors";
  }
  return "Request failed";
}

export async function downloadFile(
  endpoint: string,
  fileName: string,
  params?: Record<string, any>,
): Promise<void> {
  const token =
    localStorage.getItem("admin_token") ||
    localStorage.getItem("faculty_token") ||
    localStorage.getItem("student_token");
  const cleanToken = token ? token.replace(/^"|"$/g, "") : null;

  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const authHeaders = {
    ...(cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {}),
  };

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: authHeaders,
    });

    // Async PDF jobs return 202 + jobId; poll then download.
    if (response.status === 202) {
      const queued = await response.json().catch(() => ({}));
      const jobId = queued?.jobId as string | undefined;
      if (!jobId) {
        toast.error("Download queued but no job id was returned");
        return;
      }
      toast.loading("Preparing PDF…", { id: `pdf-job-${jobId}` });
      const statusPath =
        typeof queued.monitorUrl === "string" && queued.monitorUrl.startsWith("http")
          ? queued.monitorUrl
          : `${BASE_URL_FROM_ENDPOINT(url)}/academics/registrations/pdf/jobs/${jobId}`;
      const downloadPath =
        typeof queued.downloadUrl === "string" && queued.downloadUrl.startsWith("http")
          ? queued.downloadUrl
          : `${BASE_URL_FROM_ENDPOINT(url)}/academics/registrations/pdf/jobs/${jobId}/download`;

      const ready = await pollPdfJob(statusPath, authHeaders, jobId);
      if (!ready) {
        toast.error("PDF generation timed out. Please try again.", {
          id: `pdf-job-${jobId}`,
        });
        return;
      }

      const fileRes = await fetch(downloadPath, {
        method: "GET",
        headers: authHeaders,
      });
      if (!fileRes.ok) {
        const data = await fileRes.json().catch(() => ({}));
        handleHttpError(fileRes.status, data, true, downloadPath);
        toast.dismiss(`pdf-job-${jobId}`);
        return;
      }
      const blob = await fileRes.blob();
      triggerBrowserDownload(blob, queued.filename || fileName);
      toast.success("Download started", { id: `pdf-job-${jobId}` });
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      handleHttpError(response.status, data, true, url);
      return;
    }

    const blob = await response.blob();
    triggerBrowserDownload(blob, fileName);
    toast.success("Download started");
  } catch (error: any) {
    toast.error("Failed to download file. Please try again.");
    console.error("Download error:", error);
  }
}

function BASE_URL_FROM_ENDPOINT(endpoint: string): string {
  try {
    const u = new URL(endpoint);
    // strip trailing /api/v1/... down to origin + /api/v1 if present
    const idx = u.pathname.indexOf("/api/v1");
    if (idx >= 0) return `${u.origin}/api/v1`;
    return u.origin;
  } catch {
    return "";
  }
}

async function pollPdfJob(
  statusUrl: string,
  headers: Record<string, string>,
  jobId: string,
  timeoutMs = 180_000,
): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const res = await fetch(statusUrl, { headers });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.status === "done") return true;
      if (data.status === "failed") {
        toast.error(data.message || "PDF generation failed", {
          id: `pdf-job-${jobId}`,
        });
        return false;
      }
      const pct = Number(data.percent || 0);
      toast.loading(`Preparing PDF… ${pct}%`, { id: `pdf-job-${jobId}` });
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  return false;
}

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

function handleHttpError(
  status: number,
  data: any,
  showToast: boolean,
  url = "",
) {
  if (!showToast) return;

  const code = data.code || data.error?.code;
  const message =
    extractApiErrorMessage(data) ||
    (typeof data.error === "string" ? data.error : undefined);

  const isLoginPath =
    url.includes("/auth/login") ||
    url.includes("/auth/signin") ||
    url.includes("/auth/otp/verify");

  switch (status) {
    case 401:
      if (isLoginPath) {
        toast.error("Incorrect username or password.");
      } else {
        toast.error("Session expired or unauthorized. Logging out...");

        // Immediate Universal Logout Operation
        localStorage.clear();

        // Sudden Redirect to login
        setTimeout(() => {
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }, 800);
      }
      break;
    case 403:
      if (code === ErrorCode.AUTH_SUSPENDED || data.code === "AUTH_SUSPENDED") {
        toast.error("Your account is suspended. Contact administrator.");
      } else {
        toast.error(
          message || "You don't have permission to perform this action.",
        );
      }
      break;
    case 404:
      toast.error(message || "The requested resource was not found.");
      break;
    case 409:
      if (code === ErrorCode.RESOURCE_ALREADY_EXISTS) {
        toast.error(message || "A similar request already exists.");
      } else {
        toast.error(message || "Conflict occurred. Please try again.");
      }
      break;
    case 429:
      toast.error(message || "Too many requests. Please slow down.");
      break;
    case 400:
      if (code === ErrorCode.VALIDATION_ERROR) {
        toast.error(message || "Please check the information you provided.");
      } else if (
        code === ErrorCode.AUTH_CAPTCHA_FAILED ||
        data.code === "AUTH_CAPTCHA_FAILED"
      ) {
        toast.error(
          message || "Security verification failed. Please try again.",
        );
      } else {
        toast.error(message || "Bad request. Please check your input.");
      }
      break;
    case 500:
      toast.error("A server error occurred. Our engineers are notified.");
      break;
    default:
      toast.error(message || "An unexpected error occurred.");
  }
}
