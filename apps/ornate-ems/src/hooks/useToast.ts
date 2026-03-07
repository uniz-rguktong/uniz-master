import { useContext } from "react";
import { ClbToastContext } from "../context/ClbToastContext";

export function useToast() {
  const context = useContext(ClbToastContext);
  if (!context) {
    // If used outside of provider (like on some older pages), fallback to partial functionality or error
    return {
      toast: null,
      showToast: (
        message: string,
        type?: "success" | "error" | "info" | "warning",
      ) => console.warn("useToast used outside of ToastProvider: " + message),
      hideToast: () => {},
    };
  }
  return context;
}
