import express from "express";
import cors from "cors";
import axios from "axios";
import path from "path";
import compression from "compression";
import Redis from "ioredis";
import httpProxy from "http-proxy";
import http from "http";
import dotenv from "dotenv";
dotenv.config({ override: true });

// Pre-configured Axios instance for internal communications with Keep-Alive
const internalClient = axios.create({
  timeout: 5000,
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 200 }),
});

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

// Initialize Redis for High-Speed Caching
const redis = new Redis(process.env.REDIS_URL || "redis://uniz-redis:6379", {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
});

redis.on("error", (err: Error) =>
  console.error("[Redis] Connection Error:", err.message),
);
redis.on("connect", () => console.log("[Redis] Connected for Caching"));

// Initialize High-Performance Proxy Engine
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  // Ensure connection pooling
  agent: new (require("http").Agent)({ keepAlive: true, maxSockets: 100 }),
});

proxy.on("error", (err: Error, req: any, res: any) => {
  console.error("[Proxy-Error]", err.message);
  if (!res.headersSent) {
    res
      .status(502)
      .json({ error: "Upstream Service Unreachable", message: err.message });
  }
});

// 1. Compression (Drastically reduces payload size)
app.use(compression());

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

// 2. Optimized CORS
app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-cms-api-key, x-api-key, uid, role",
      );
      res.setHeader("Access-Control-Max-Age", "86400");
    }

    if (req.method === "OPTIONS") return res.status(204).end();
    next();
  },
);

// 3. Smart Cache Middleware
const cacheMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  // Only cache GET requests
  if (req.method !== "GET") return next();

  // Skip cache if explicitly requested
  if (req.headers["cache-control"] === "no-cache") return next();

  // Generate unique key based on URL and User Context (Role/UID)
  // This prevents caching cross-user data leaking
  const userKey = req.headers["uid"] || req.headers["authorization"] || "guest";
  const cacheKey = `proxy_cache:${req.url}:${userKey}`;

  try {
    const cachedResponse = await redis.get(cacheKey);
    if (cachedResponse && req.headers["cache-control"] !== "no-cache") {
      const { data, headers, status } = JSON.parse(cachedResponse);
      console.log(`[Cache-Hit] ${req.url}`);

      // Set headers from cache
      Object.entries(headers).forEach(([k, v]) =>
        res.setHeader(k, v as string),
      );
      res.setHeader("X-Cache", "HIT");
      return res.status(status).send(data);
    }
  } catch (e) {
    console.error("[Cache-Read-Error]", e);
  }

  // If No Cache, intercept the send to store it
  const originalSend = res.send;
  (res as any).send = function (body: any) {
    if (res.statusCode === 200 && req.headers["cache-control"] !== "no-cache") {
      const respToCache = {
        data: body,
        headers: res.getHeaders(),
        status: res.statusCode,
      };
      // Cache for 1 second to allow near real-time updates while protecting against bursts
      redis
        .setex(cacheKey, 1, JSON.stringify(respToCache))
        .catch((err: Error) => console.error("[Cache-Write-Error]", err));
    }
    return originalSend.apply(res, [body]);
  };

  res.setHeader("X-Cache", "MISS");
  next();
};

const serviceMap: Record<string, string> = {
  auth:
    process.env.AUTH_SERVICE_URL ||
    "http://uniz-auth-service.default.svc.cluster.local:3001",
  profile:
    process.env.USER_SERVICE_URL ||
    "http://uniz-user-service.default.svc.cluster.local:3002",
  cms:
    process.env.USER_SERVICE_URL ||
    "http://uniz-user-service.default.svc.cluster.local:3002",
  academics:
    process.env.ACADEMICS_SERVICE_URL ||
    "http://uniz-academics-service.default.svc.cluster.local:3004",
  requests:
    process.env.OUTPASS_SERVICE_URL ||
    "http://uniz-outpass-service.default.svc.cluster.local:3003",
  files:
    process.env.FILES_SERVICE_URL ||
    "http://uniz-files-service.default.svc.cluster.local:3005",
  mail:
    process.env.MAIL_SERVICE_URL ||
    "http://uniz-mail-service.default.svc.cluster.local:3006",
  notifications:
    process.env.NOTIFICATION_SERVICE_URL ||
    "http://uniz-notification-service.default.svc.cluster.local:3007",
  cron:
    process.env.CRON_SERVICE_URL ||
    "http://uniz-cron-service.default.svc.cluster.local:3008",
  grievance:
    process.env.OUTPASS_SERVICE_URL ||
    "http://uniz-outpass-service.default.svc.cluster.local:3003",
  docs:
    process.env.DOCS_SERVICE_URL ||
    "http://uniz-docs-service.default.svc.cluster.local:3333",
};

// 4. Documentation Engine Assets & Navigation Helper (Aggressive Asset Retrieval)
app.use((req, res, next) => {
  const referer = req.headers.referer || "";
  const isDocsReferer = referer.includes("/docs");
  const isApiRequest = req.url.startsWith("/api/v1");
  const isDocsRequest = req.url.startsWith("/docs");
  const docsTarget = process.env.DOCS_SERVICE_URL || (process.env.NODE_ENV === 'production' ? "http://uniz-docs-service.default.svc.cluster.local:3333" : "http://localhost:3333");
  
  // List of high-level documentation paths that should be prefixed with /docs
  const docRoutes = [
    "/introduction", "/quickstart", "/roles", "/students", "/admin", "/faculty", "/api-reference",
    "/api/auth", "/api/academics", "/api/requests", "/api/profile" // API Doc Routes
  ];
  const isDocNavigation = docRoutes.some(route => req.url.startsWith(route));

  // If it's a direct navigation to a doc page without /docs prefix, REDIRECT them to the correct home
  if (isDocNavigation && !isDocsRequest && !isApiRequest) {
    return res.redirect(308, `/docs${req.url}`);
  }

  // If it's a non-API asset request originating from the docs page, 
  // try to fetch it from the docs service before letting it fall through
  if (isDocsReferer && !isApiRequest && !isDocsRequest) {
    return proxy.web(req, res, { target: docsTarget });
  }
  next();
});

app.use("/docs", (req, res) => {
  // Pass the full original path to the documentation service
  const path = req.originalUrl.replace(/^\/docs/, "/").replace(/\/+/, "/");
  req.url = path;
  const docsTarget = process.env.DOCS_SERVICE_URL || (process.env.NODE_ENV === 'production' ? "http://uniz-docs-service.default.svc.cluster.local:3333" : "http://localhost:3333");
  
  proxy.web(req, res, { 
    target: docsTarget,
    changeOrigin: true 
  });
});

// 4. Standard Health Endpoints with Precision Timing & 2s Cache
const healthCache = new Map<string, { data: any; expiry: number }>();

app.get(
  "/api/v1/system/health",
  async (req: express.Request, res: express.Response) => {
    const cacheKey = "system_health_aggregate";
    const now = performance.now();

    if (healthCache.has(cacheKey) && healthCache.get(cacheKey)!.expiry > now) {
      return res.json({ ...healthCache.get(cacheKey)!.data, cached: true });
    }

    const resultPromises = Object.entries(serviceMap).map(
      async ([name, url]) => {
        try {
          const start = performance.now();
          await internalClient.get(`${url.replace(/\/$/, "")}/health`);
          const latency = (performance.now() - start).toFixed(2);
          return { name, status: "healthy", latency: `${latency}ms` };
        } catch (e: any) {
          return { name, status: "unhealthy", error: e.message };
        }
      },
    );

    const results = await Promise.all(resultPromises);
    const allOk = results.every((r) => r.status === "healthy");
    const data = { status: allOk ? "ok" : "degraded", services: results };

    healthCache.set(cacheKey, { data, expiry: now + 2000 }); // Cache for 2 seconds
    res.status(allOk ? 200 : 503).json(data);
  },
);

// 5. Warp-Speed Proxy Engine
app.all("/api/v1/:service/(.*)", async (req: any, res: any) => {
  const service = (req.params.service as string).toLowerCase();
  const target = serviceMap[service];

  if (!target) return res.status(404).json({ error: "Service Not Found" });

  const path = req.url.split("/").slice(4).join("/");
  req.url = `/${path}`;

  // Bypass Warp Engine for binary files or download routes to prevent corruption
  const isBinaryRequest =
    req.url.includes("/download/") ||
    req.url.endsWith(".pdf") ||
    req.url.endsWith(".xlsx") ||
    req.url.endsWith(".zip");

  // Bypass Warp Engine for sensitive personal data to prevent accidental leaks
  const isSensitive =
    req.url.includes("/me") ||
    req.url.includes("/profile") ||
    req.url.includes("/student/me") ||
    req.url.includes("/grades") ||
    req.url.includes("/attendance");

  if (
    req.method === "GET" &&
    req.headers["cache-control"] !== "no-cache" &&
    !isBinaryRequest &&
    !isSensitive
  ) {
    // Generate unique key based on URL and User Context (Auth Token / User-Agent)
    const userKey =
      req.headers["authorization"] || req.headers["uid"] || "guest";
    const cacheKey = `p3:${service}:${Buffer.from(req.url).toString("base64").substring(0, 16)}:${Buffer.from(userKey).toString("base64").substring(0, 8)}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const { data, headers, status } = JSON.parse(cached);
        res.setHeader("X-Cache", "HIT");
        res.setHeader("X-Response-Time", "sub-1ms");

        // Restore all headers from cache
        Object.entries(headers).forEach(([k, v]) =>
          res.setHeader(k, v as string),
        );
        return res.status(status).send(Buffer.from(data, "base64"));
      }

      const response = await internalClient.get(
        `${target.replace(/\/$/, "")}/${path}`,
        {
          headers: { ...req.headers, host: new URL(target).host },
          responseType: "arraybuffer", // Use arraybuffer to handle mixed content
          validateStatus: () => true,
        },
      );

      const contentType = response.headers["content-type"] || "";
      const isJson = contentType.includes("application/json");

      if (response.status === 200 && isJson) {
        // Only cache JSON responses to prevent binary blowup in Redis
        redis
          .setex(
            cacheKey,
            2, // 2 second cache for blazing speed
            JSON.stringify({
              data: Buffer.from(response.data).toString("base64"),
              headers: response.headers,
              status: response.status,
            }),
          )
          .catch(() => {});
      }

      // Restore headers from upstream
      Object.entries(response.headers).forEach(([k, v]) =>
        res.setHeader(k, v as string),
      );
      return res.status(response.status).send(response.data);
    } catch (e: any) {
      console.error("[Warp-Engine-Error]", e.message);
      // Fallback to streaming proxy on any engine failure
    }
  }

  proxy.web(req, res, { target });
});

app.get("/", (req: express.Request, res: express.Response) => {
  res.send(`
<pre style="background: black; color: white; padding: 20px; font-family: monospace;">
██╗   ██╗███╗   ██╗██╗███████╗
██║   ██║████╗  ██║██║╚══███╔╝
██║   ██║██╔██╗ ██║██║  ███╔╝ 
██║   ██║██║╚██╗██║██║ ███╔╝  
╚██████╔╝██║ ╚████║██║███████╗
 ╚═════╝ ╚═╝  ╚═══╝╚═╝╚══════╝

UniZ Ultra-Speed Gateway - Layer 7 (status: blazing)
Caching: Enabled (Redis)
Compression: Enabled (Gzip)
Proxying: Streaming Engine
Attribution: SABER Node
</pre>
  `);
});

app.listen(PORT, () => {
  console.log(`[Super-Gateway] Blazing fast at port ${PORT}`);
});
// Force build trigger - Wed Apr  1 18:19:43 IST 2026
