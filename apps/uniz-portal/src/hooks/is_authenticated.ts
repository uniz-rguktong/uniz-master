import { useEffect } from "react";
import { is_authenticated } from "../store";
import { useRecoilState } from "recoil";
import { useNavigate, useLocation } from "react-router-dom";
import { isTokenValid, parseJwt, clearSession } from "../utils/security";
import { toast } from "@/utils/toast-ref";
import { initPushNotifications } from "../utils/pushNotifications";
import { NOTIFICATION_SERVICE_URL } from "../api/endpoints";

// Module-level singleton — shared across ALL useIsAuth instances in the app.
// useRef(false) would NOT work here because useIsAuth is called by 10+ components,
// each getting their own separate ref. This ensures push fires exactly once per session.
let pushInitialized = false;

export function useIsAuth() {
  const [isAuth, setAuth] = useRecoilState(is_authenticated);
  const navigateTo = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getSafeToken = (key: string) => {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      try {
        const parsed = JSON.parse(stored);
        // If it was a quoted string in storage, returning the parsed version is correct.
        // If it was a raw string that happens to be valid JSON (rare for tokens), we might get here.
        return typeof parsed === "string" ? parsed : stored;
      } catch (e) {
        // If it's not JSON, it's a raw string (which is what we want now)
        return stored;
      }
    };

    const studentToken = getSafeToken("student_token");
    const adminToken = getSafeToken("admin_token");
    const storedUsername = getSafeToken("username");
    const publicPaths = [
      "/",
      "/login",
      "/signin",
      "/student/signin",
      "/admin/signin",
      "/admin/signin/",
      "/admin/signin#",
    ];

    const logoutAndRedirect = (reason: string) => {
      const wasAuth = isAuth.is_authnticated;
      clearSession();
      setAuth({ is_authnticated: false, type: "" });
      if (wasAuth || !publicPaths.includes(location.pathname)) {
        toast.error(`Security Alert: ${reason}`);
        navigateTo("/");
      }
    };

    if (
      adminToken === "MALFORMED" ||
      studentToken === "MALFORMED" ||
      storedUsername === "MALFORMED"
    ) {
      return logoutAndRedirect("Storage tampering detected");
    }

    if (adminToken) {
      if (!isTokenValid(adminToken)) {
        return logoutAndRedirect("Session expired or invalid");
      }
      const decoded = parseJwt(adminToken);
      const validAdminRoles = [
        "admin",
        "webmaster",
        "dean",
        "director",
        "caretaker",
        "warden",
        "dsw",
        "swo",
        "hod",
        "faculty",
        "security",
        "warden_male",
        "warden_female",
        "caretaker_male",
        "caretaker_female",
      ];
      const storedRole = localStorage.getItem("admin_role");
      const roleToVerify =
        decoded?.role ||
        (storedRole ? storedRole.replace(/"/g, "") : "") ||
        "admin";

      if (!validAdminRoles.includes(roleToVerify)) {
        return logoutAndRedirect("Access violation: Invalid Role");
      }

      // Valid Admin
      if (!isAuth.is_authnticated) {
        setAuth({ is_authnticated: true, type: "admin" });
      }

      // Silently init push notifications once
      if (!pushInitialized && decoded?.username) {
        pushInitialized = true;
        initPushNotifications(decoded.username, NOTIFICATION_SERVICE_URL);
      }

      if (publicPaths.includes(location.pathname)) {
        navigateTo("/admin");
      }
    } else if (studentToken) {
      if (!isTokenValid(studentToken)) {
        return logoutAndRedirect("Session expired or invalid");
      }
      const decoded = parseJwt(studentToken);
      // Check if role exists and implies student
      if (decoded?.role && decoded.role !== "student") {
        return logoutAndRedirect("Access violation");
      }

      if (
        decoded?.username &&
        storedUsername &&
        decoded.username.toLowerCase() !== storedUsername.toLowerCase()
      ) {
        return logoutAndRedirect("Identity mismatch");
      }

      // Valid Student
      if (!isAuth.is_authnticated) {
        setAuth({ is_authnticated: true, type: "student" });
      }

      // Silently init push notifications once
      if (!pushInitialized && decoded?.username) {
        pushInitialized = true;
        initPushNotifications(decoded.username, NOTIFICATION_SERVICE_URL);
      }

      if (publicPaths.includes(location.pathname)) {
        navigateTo("/student");
      }
    } else {
      // No tokens
      if (!publicPaths.includes(location.pathname)) {
        // Only redirect if we are not already on a public page
        // And assuming protected routes need auth
        navigateTo("/");
      }
    }
  }, [isAuth, navigateTo, setAuth, location.pathname]);

  return isAuth;
}
