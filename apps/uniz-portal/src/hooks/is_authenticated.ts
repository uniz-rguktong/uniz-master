import { useEffect, useRef } from "react";
import { is_authenticated } from "../store";
import { useRecoilState } from "recoil";
import { useNavigate, useLocation } from "react-router-dom";
import { isTokenValid, parseJwt, clearSession } from "../utils/security";
import { toast } from "@/utils/toast-ref";
import { initPushNotifications } from "../utils/pushNotifications";
import { NOTIFICATION_SERVICE_URL } from "../api/endpoints";

// Module-level singleton - shared across ALL useIsAuth instances in the app.
// useRef(false) would NOT work here because useIsAuth is called by 10+ components,
// each getting their own separate ref. This ensures push fires exactly once per session.
let pushInitialized = false;

export function useIsAuth() {
  const [isAuth, setAuth] = useRecoilState(is_authenticated);
  const navigateTo = useNavigate();
  const location = useLocation();

  // Stable refs - avoid stale closure issues without adding these to useEffect deps
  const isAuthRef = useRef(isAuth);
  const setAuthRef = useRef(setAuth);
  const navigateRef = useRef(navigateTo);
  useEffect(() => {
    isAuthRef.current = isAuth;
  }, [isAuth]);
  useEffect(() => {
    setAuthRef.current = setAuth;
  }, [setAuth]);
  useEffect(() => {
    navigateRef.current = navigateTo;
  }, [navigateTo]);

  useEffect(() => {
    const getSafeToken = (key: string) => {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      try {
        const parsed = JSON.parse(stored);
        return typeof parsed === "string" ? parsed : stored.replace(/^"|"$/g, "");
      } catch {
        return stored.replace(/^"|"$/g, "");
      }
    };

    const authRedirectTarget = () => {
      if (location.pathname.startsWith("/admin")) return "/admin/signin";
      if (location.pathname.startsWith("/student")) return "/student/signin";
      return "/";
    };

    const navigate = navigateRef.current;
    const setAuthFn = setAuthRef.current;
    const currentIsAuth = isAuthRef.current;

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
      const wasAuth = currentIsAuth.is_authenticated;
      clearSession();
      setAuthFn({ is_authenticated: false, type: "" });
      if (wasAuth || !publicPaths.includes(location.pathname)) {
        toast.error(`Security Alert: ${reason}`);
        navigate(authRedirectTarget());
      }
    };

    const studentToken = getSafeToken("student_token");
    const adminToken = getSafeToken("admin_token");
    const storedUsername = getSafeToken("username");

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
        "coe",
      ];
      const storedRole = localStorage.getItem("admin_role")?.replace(/"/g, "");
      const jwtRole = decoded?.role?.toLowerCase();
      const localRole = storedRole?.toLowerCase();

      // Keep localStorage role aligned with the signed JWT (case-insensitive).
      if (jwtRole && localRole && jwtRole !== localRole) {
        localStorage.setItem("admin_role", jwtRole);
      } else if (jwtRole && !localRole) {
        localStorage.setItem("admin_role", jwtRole);
      }

      const roleToVerify = jwtRole || localRole || "admin";

      if (!validAdminRoles.includes(roleToVerify)) {
        return logoutAndRedirect("Access violation: Invalid Role");
      }

      // Valid Admin
      if (!currentIsAuth.is_authenticated) {
        setAuthFn({ is_authenticated: true, type: "admin" });
      }

      // Silently init push notifications once
      if (!pushInitialized && decoded?.username) {
        pushInitialized = true;
        initPushNotifications(decoded.username, NOTIFICATION_SERVICE_URL);
      }

      if (publicPaths.includes(location.pathname)) {
        navigate("/admin");
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
      if (!currentIsAuth.is_authenticated) {
        setAuthFn({ is_authenticated: true, type: "student" });
      }

      // Silently init push notifications once
      if (!pushInitialized && decoded?.username) {
        pushInitialized = true;
        initPushNotifications(decoded.username, NOTIFICATION_SERVICE_URL);
      }

      if (publicPaths.includes(location.pathname)) {
        navigate("/student");
      }
    } else {
      // No tokens — send protected routes to the right sign-in, not always home.
      if (!publicPaths.includes(location.pathname)) {
        navigate(authRedirectTarget());
      }
    }
    // Only re-run when the URL changes - NOT on every isAuth/setAuth change.
    // Auth state changes (setAuth calls) are idempotent; re-running on every
    // one of them from 15+ components causes an explosion of redundant checks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return isAuth;
}
