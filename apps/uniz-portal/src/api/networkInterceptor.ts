import { ANALYTICS_KEY } from "./endpoints";

/**
 * Global Network Interceptor
 * Automatically injects the x-api-key into all fetch requests 
 * that target UniZ services or analytics.
 */
export function initializeGlobalInterceptor() {
  const { fetch: originalFetch } = window;

  window.fetch = async (...args) => {
    let [resource, config] = args;

    // Ensure config exists
    config = config || {};
    config.headers = config.headers || {};

    // Normalize URL for check
    const url = typeof resource === "string" ? resource : resource instanceof URL ? resource.href : resource.url;

    // If it's a UniZ request (api or analytics), inject the key
    // We check for "analytics" or "/api/v1" or common domains
    const isUnizRequest = 
      url.includes("/api/v1") || 
      url.includes("analytics") || 
      url.includes(".rguktong.in") ||
      url.includes("vercel.app"); // Analytics fallback

    if (isUnizRequest && ANALYTICS_KEY) {
      if (config.headers instanceof Headers) {
        if (!config.headers.has("x-api-key")) {
          config.headers.set("x-api-key", ANALYTICS_KEY);
        }
      } else if (Array.isArray(config.headers)) {
        // Handle array of arrays [[key, value]]
        const hasKey = config.headers.some(([key]) => key.toLowerCase() === "x-api-key");
        if (!hasKey) {
          (config.headers as string[][]).push(["x-api-key", ANALYTICS_KEY]);
        }
      } else {
        // Handle record object
        const headersRecord = config.headers as Record<string, string>;
        const keys = Object.keys(headersRecord).map(k => k.toLowerCase());
        if (!keys.includes("x-api-key")) {
          headersRecord["x-api-key"] = ANALYTICS_KEY;
        }
      }
    }

    const response = await originalFetch(resource, config);

    // Auth-Aware Eviction: Don't logout if the 401 comes from a login attempt
    const isLoginAttempt = 
      url.includes("/auth/login") || 
      url.includes("/auth/signin") ||
      url.includes("/auth/otp");

    if (response.status === 401 && !isLoginAttempt) {
      console.warn("[NetworkInterceptor] 401 Unauthorized detected. Clearing session...");
      
      // Destructive clear to ensure no state remains
      localStorage.clear();

      // Sudden redirect to login gateway
      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }, 500);
    }

    return response;
  };

  console.log("[NetworkInterceptor] Global fetch interceptor initialized.");
}
