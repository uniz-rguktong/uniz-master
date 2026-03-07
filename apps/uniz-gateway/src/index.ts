import express from "express";
import cors from "cors";
import axios from "axios";
import path from "path";
import compression from "compression";
import Redis from "ioredis";
import httpProxy from "http-proxy";

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Redis for High-Speed Caching
const redis = new Redis(process.env.REDIS_URL || "redis://uniz-redis:6379", {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on("error", (err) =>
  console.error("[Redis] Connection Error:", err.message),
);
redis.on("connect", () => console.log("[Redis] Connected for Caching"));

// Initialize High-Performance Proxy Engine
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  // Ensure connection pooling
  agent: new (require("http").Agent)({ keepAlive: true, maxSockets: 100 }),
});

proxy.on("error", (err, req, res: any) => {
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
app.use((req, res, next) => {
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
});

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
    if (cachedResponse) {
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
    if (res.statusCode === 200) {
      const respToCache = {
        data: body,
        headers: res.getHeaders(),
        status: res.statusCode,
      };
      // Cache for 60 seconds by default
      redis
        .setex(cacheKey, 60, JSON.stringify(respToCache))
        .catch((err) => console.error("[Cache-Write-Error]", err));
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
};

// 4. Standard Health Endpoints (Fast path)
app.get("/gateway-status", (req, res) =>
  res.json({
    status: "alive",
    attribution: "SABER",
    node: process.env.HOSTNAME,
  }),
);

app.get("/api/v1/system/health", async (req, res) => {
  const resultPromises = Object.entries(serviceMap).map(async ([name, url]) => {
    try {
      const start = Date.now();
      await axios.get(`${url.replace(/\/$/, "")}/health`, { timeout: 2000 });
      return { name, status: "healthy", latency: `${Date.now() - start}ms` };
    } catch (e: any) {
      return { name, status: "unhealthy", error: e.message };
    }
  });
  const results = await Promise.all(resultPromises);
  const allOk = results.every((r) => r.status === "healthy");
  res
    .status(allOk ? 200 : 503)
    .json({ status: allOk ? "ok" : "degraded", services: results });
});

// 5. The Heavy Lifter: Streaming Proxy with Path Rewriting + Caching
app.all("/api/v1/:service/(.*)", async (req: any, res: any) => {
  const service = (req.params.service as string).toLowerCase();
  const target = serviceMap[service];

  if (!target)
    return res.status(404).json({ error: "Service Not Found", service });

  // Path Rewriting (DO THIS FIRST)
  const path = req.url.split("/").slice(4).join("/");
  req.url = `/${path}`;

  // Cache Key Logic
  const userKey = req.headers["uid"] || req.headers["authorization"] || "guest";
  const cacheKey = `proxy_v3:${req.url}:${userKey}`;

  // Purge logic
  if (req.headers["x-cache-purge"]) {
    await redis.del(cacheKey);
    console.log(`[Cache-Purged] ${req.url}`);
  }

  // GET Cache Lookup + Fetch
  if (req.method === "GET" && req.headers["cache-control"] !== "no-cache") {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const { data, headers, status } = JSON.parse(cached);
        Object.entries(headers).forEach(([k, v]) =>
          res.setHeader(k, v as string),
        );
        res.setHeader("X-Cache", "HIT");
        return res.status(status).send(data);
      }

      // If MISS, fetch with axios for caching
      const targetUrl = `${target.replace(/\/$/, "")}/${path}`;
      const response = await axios.get(targetUrl, {
        headers: { ...req.headers, host: new URL(target).host },
        responseType: "arraybuffer", // Use arraybuffer to prevent binary corruption (Excel, Images, etc.)
        validateStatus: () => true,
      });

      const contentType = response.headers["content-type"] || "";
      const isBinary = /image|video|audio|pdf|excel|spreadsheet|zip/i.test(
        contentType,
      );

      if (response.status === 200 && !isBinary) {
        const respToCache = {
          data: response.data.toString("utf-8"),
          headers: response.headers,
          status: response.status,
        };
        redis.setex(cacheKey, 60, JSON.stringify(respToCache)).catch(() => {});
      }

      Object.entries(response.headers).forEach(([k, v]) =>
        res.setHeader(k, v as string),
      );
      res.setHeader("X-Cache", "MISS");
      return res.status(response.status).send(response.data);
    } catch (e: any) {
      console.error("[Cache-Fetch-Error]", e.message);
    }
  }

  // Fallback to Streaming Proxy for POST/PUT/DELETE or large streams
  res.setHeader("X-Cache", "BYPASS");
  proxy.web(req, res, { target });
});

app.get("/", (req, res) => {
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
