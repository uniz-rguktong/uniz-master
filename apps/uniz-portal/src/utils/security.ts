export interface DecodedToken {
  username: string;
  role: string;
  exp: number;
  iat: number;
}

export const parseJwt = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;

  const decoded = parseJwt(token);
  if (!decoded) return false;

  // Check Expiration (exp is in seconds)
  const currentTime = Date.now() / 1000;
  if (decoded.exp < currentTime) {
    return false;
  }

  return true;
};

export const clearSession = () => {
  // Clear all localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();

  // Clear all cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
};
