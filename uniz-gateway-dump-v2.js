"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOriginsRaw =
    process.env.CLIENT_URL ||
    "http://localhost:5173,http://localhost:5174,http://localhost:3000";
  const allowedOrigins = allowedOriginsRaw.split(",").map((o) => o.trim());
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
    );
  }
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});
app.use(express_1.default.json());
const services = [
  {
    name: "Auth Service",
    env: "AUTH_SERVICE_URL",
    default: "http://uniz-auth-service:3001",
  },
  {
    name: "User Service",
    env: "USER_SERVICE_URL",
    default: "http://uniz-user-service:3002",
  },
  {
    name: "Academics Service",
    env: "ACADEMICS_SERVICE_URL",
    default: "http://uniz-academics-service:3004",
  },
  {
    name: "Outpass Service",
    env: "OUTPASS_SERVICE_URL",
    default: "http://uniz-outpass-service:3003",
  },
  {
    name: "Files Service",
    env: "FILES_SERVICE_URL",
    default: "http://uniz-files-service:3005",
  },
  {
    name: "Mail Service",
    env: "MAIL_SERVICE_URL",
    default: "http://uniz-mail-service:3006",
  },
  {
    name: "Notification Service",
    env: "NOTIFICATION_SERVICE_URL",
    default: "http://uniz-notification-service:3007",
  },
  {
    name: "Cron Service",
    env: "CRON_SERVICE_URL",
    default: "http://uniz-cron-service:3008",
  },
];
const serviceMap = {
  auth: process.env.AUTH_SERVICE_URL || "http://uniz-auth-service:3001",
  profile: process.env.USER_SERVICE_URL || "http://uniz-user-service:3002",
  cms: process.env.USER_SERVICE_URL || "http://uniz-user-service:3002",
  academics:
    process.env.ACADEMICS_SERVICE_URL || "http://uniz-academics-service:3004",
  requests:
    process.env.OUTPASS_SERVICE_URL || "http://uniz-outpass-service:3003",
  files: process.env.FILES_SERVICE_URL || "http://uniz-files-service:3005",
  mail: process.env.MAIL_SERVICE_URL || "http://uniz-mail-service:3006",
  notifications:
    process.env.NOTIFICATION_SERVICE_URL ||
    "http://uniz-notification-service:3007",
  cron: process.env.CRON_SERVICE_URL || "http://uniz-cron-service:3008",
  grievance:
    process.env.OUTPASS_SERVICE_URL || "http://uniz-outpass-service:3003",
};
app.get("/", (req, res) => {
  res.send("UniZ Gateway Patched - Operational");
});
// System Health Check
app.get("/api/v1/system/health", async (req, res) => {
  console.log(`[Gateway] System Aggregated Health Check`);
  const results = await Promise.all(
    services.map(async (service) => {
      const baseUrl = process.env[service.env] || service.default;
      const healthUrl = baseUrl.endsWith("/health")
        ? baseUrl
        : `${baseUrl.replace(/\/$/, "")}/health`;
      try {
        const start = Date.now();
        await axios_1.default.get(healthUrl, { timeout: 2000 }); // Fast timeout for responsiveness
        return {
          name: service.name,
          status: "healthy",
          latency: `${Date.now() - start}ms`,
        };
      } catch (error) {
        return {
          name: service.name,
          status: "unhealthy",
          error: error.message,
        };
      }
    }),
  );
  const allHealthy = results.every((r) => r.status === "healthy");
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    services: results,
    attribution: "SABER",
  });
});
// Use a regex for maximum compatibility with Express 5 / path-to-regexp v6
// Captures service in group 1 and path in group 2
app.all(/^\/api\/v1\/([^/]+)\/(.*)/, async (req, res) => {
  const service = req.params[0]; // group 1
  const pathPart = req.params[1]; // group 2
  if (service === "system" && pathPart === "health") {
    // This block catches cases where express router might match the regex before the specific route
    // But since specific routes take precedence usually, this is a fallback.
    // However, we already defined app.get("/api/v1/system/health") above.
    // So this might not be reached if the method is GET.
    // But if express behavior varies, this safe-guard is good.
    return; // Handled above hopefully, or we can duplicate logic here if needed.
  }
  const serviceKey = service.toLowerCase();
  const targetBase = serviceMap[serviceKey];
  if (!targetBase) {
    return res
      .status(404)
      .json({ error: `Service ${service} not found in gateway map` });
  }
  // With regex, we can reconstruct the target URL more accurately
  const query = req.url.includes("?")
    ? req.url.substring(req.url.indexOf("?"))
    : "";
  const targetUrl = `${targetBase.replace(/\/$/, "")}/${pathPart}${query}`;
  console.log(`[Proxy-Regex] ${req.method} ${req.url} -> ${targetUrl}`);
  try {
    const cleanedHeaders = { ...req.headers };
    delete cleanedHeaders.host;
    // delete cleanedHeaders["content-length"]; // PATCHED BY ANTIGRAVITY - DO NOT DELETE CONTENT-LENGTH FOR MULTIPART

    const axiosConfig = {
      method: req.method,
      url: targetUrl,
      headers: { ...cleanedHeaders, host: new URL(targetBase).host },
      validateStatus: () => true,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 300000, // PATCHED BY ANTIGRAVITY - 5 MIN TIMEOUT
    };
    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      axiosConfig.data = req.body;
    }
    const response = await (0, axios_1.default)(axiosConfig);
    res.status(response.status).json(response.data);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Gateway Proxy Error", message: error.message });
  }
});
app.listen(PORT, () => {
  console.log(`Regex Gateway API Service running on port ${PORT}`);
});
