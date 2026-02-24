/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "react-toastify";

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
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  errors?: any[];
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {},
  showToast = true,
): Promise<T | null> {
  const token =
    localStorage.getItem("student_token") ||
    localStorage.getItem("admin_token") ||
    localStorage.getItem("faculty_token");
  const cleanToken = token ? token.replace(/^"|"$/g, "") : null;

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {}),
  };

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      handleHttpError(response.status, data, showToast);
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

function handleHttpError(status: number, data: any, showToast: boolean) {
  if (!showToast) return;

  const code = data.code || data.error?.code;
  const message = data.message || data.msg || data.error?.message;

  switch (status) {
    case 401:
      if (code === ErrorCode.AUTH_INVALID_CREDENTIALS) {
        toast.error("Incorrect username or password.");
      } else {
        toast.error("Session expired. Please sign in again.");
        // Optional: clear tokens and redirect to login
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
