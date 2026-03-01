import express from "express";
import cors from "cors";
import axios from "axios";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

console.log("Raw CLIENT_URL:", process.env.CLIENT_URL);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];

console.log("Allowed Origins:", allowedOrigins);

// app.use(
//   cors({
//     origin: allowedOrigins,
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
//   }),
// );

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
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-cms-api-key",
    );
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});
app.use(express.json());

const services = [
  {
    name: "Auth Service",
    env: "AUTH_SERVICE_URL",
    default: "http://localhost:3001",
  },
  {
    name: "User Service",
    env: "USER_SERVICE_URL",
    default: "http://localhost:3002",
  },
  {
    name: "CMS Service",
    env: "USER_SERVICE_URL",
    default: "http://localhost:3002",
  },
  {
    name: "Academics Service",
    env: "ACADEMICS_SERVICE_URL",
    default: "http://localhost:3004",
  },
  {
    name: "Outpass Service",
    env: "OUTPASS_SERVICE_URL",
    default: "http://localhost:3003",
  },
  {
    name: "Files Service",
    env: "FILES_SERVICE_URL",
    default: "http://localhost:3005",
  },
  {
    name: "Mail Service",
    env: "MAIL_SERVICE_URL",
    default: "http://localhost:3006",
  },
  {
    name: "Notification Service",
    env: "NOTIFICATION_SERVICE_URL",
    default: "http://localhost:3007",
  },
];

const serviceMap: Record<string, string> = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  profile: process.env.USER_SERVICE_URL || "http://localhost:3002",
  cms: process.env.USER_SERVICE_URL || "http://localhost:3002",
  academics: process.env.ACADEMICS_SERVICE_URL || "http://localhost:3004",
  requests: process.env.OUTPASS_SERVICE_URL || "http://localhost:3003",
  files: process.env.FILES_SERVICE_URL || "http://localhost:3005",
  mail: process.env.MAIL_SERVICE_URL || "http://localhost:3006",
  notifications:
    process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3007",
  cron: process.env.CRON_SERVICE_URL || "http://localhost:3008",
  grievance: process.env.OUTPASS_SERVICE_URL || "http://localhost:3003",
  system: "http://localhost:3000",
};

app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/favicon.ico"));
});

app.get("/", (req, res) => {
  console.log(`[Gateway] Serving ASCII Banner to ${req.ip}`);
  res.send(`
<pre>
██╗   ██╗███╗   ██╗██╗███████╗
██║   ██║████╗  ██║██║╚══███╔╝
██║   ██║██╔██╗ ██║██║  ███╔╝ 
██║   ██║██║╚██╗██║██║ ███╔╝  
╚██████╔╝██║ ╚████║██║███████╗
 ╚═════╝ ╚═╝  ╚═══╝╚═╝╚══════╝

UniZ Backend Gateway - Running (status: ok)
Attribution: SABER
</pre>
  `);
});

app.get("/health", async (req, res) => {
  console.log(`[Gateway] Preparing Beautiful System Dashboard`);

  const results = await Promise.all(
    services.map(async (service) => {
      const baseUrl = process.env[service.env] || service.default;
      const healthUrl = baseUrl.endsWith("/health")
        ? baseUrl
        : `${baseUrl.replace(/\/$/, "")}/health`;

      try {
        const start = Date.now();
        await axios.get(healthUrl, { timeout: 3000 });
        return {
          name: service.name,
          status: "Healthy",
          color: "#4ade80",
          dots: "●",
          latency: `${Date.now() - start}ms`,
        };
      } catch (error) {
        return {
          name: service.name,
          status: "Offline",
          color: "#f87171",
          dots: "○",
          latency: "N/A",
        };
      }
    }),
  );

  const totalHealthy = results.filter((r) => r.status === "Healthy").length;
  const statusColor = totalHealthy === services.length ? "#4ade80" : "#fbbf24";

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>UniZ Status</title>
        <style>
            :root {
                --bg: #000000;
                --text: #ffffff;
                --gray: #888888;
                --border: #333333;
                --success: #ffffff;
                --error: #888888;
            }
            body {
                background: var(--bg);
                color: var(--text);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                margin: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 60px 20px;
            }
            .container {
                width: 100%;
                max-width: 600px;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 1px solid var(--border);
            }
            h1 {
                font-size: 14px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin: 0;
            }
            .overall-status {
                font-size: 12px;
                color: var(--gray);
            }
            .status-list {
                display: flex;
                flex-direction: column;
                gap: 1px;
                background: var(--border);
                border: 1px solid var(--border);
            }
            .service-row {
                background: var(--bg);
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
            }
            .service-info {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .service-name {
                font-size: 14px;
                font-weight: 400;
            }
            .latency {
                font-size: 11px;
                color: var(--gray);
                font-family: monospace;
            }
            .status-indicator {
                font-size: 11px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 1px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: currentColor;
            }
            .dot.pulse {
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { opacity: 0.4; }
                50% { opacity: 1; }
                100% { opacity: 0.4; }
            }
            .footer {
                margin-top: 60px;
                font-size: 10px;
                color: var(--gray);
                text-transform: uppercase;
                letter-spacing: 1px;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>UniZ Systems</h1>
                <div class="overall-status">
                    ${totalHealthy === services.length ? "All Systems Operational (status: ok)" : "Partial System Outage"}
                </div>
            </div>
            <div class="status-list">
                ${results
                  .map(
                    (r) => `
                    <div class="service-row">
                        <div class="service-info">
                            <span class="service-name">${r.name}</span>
                            <span class="latency">${r.latency}</span>
                        </div>
                        <div class="status-indicator" style="color: ${r.status === "Healthy" ? "var(--success)" : "var(--gray)"}">
                            <div class="dot ${r.status === "Healthy" ? "pulse" : ""}"></div>
                            ${r.status}
                        </div>
                    </div>
                `,
                  )
                  .join("")}
            </div>
            <div class="footer">
                Network Operations Center • SABER Node
            </div>
        </div>
    </body>
    </html>
  `);
});

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
        await axios.get(healthUrl, { timeout: 5000 });
        return {
          name: service.name,
          status: "healthy",
          latency: `${Date.now() - start}ms`,
        };
      } catch (error: any) {
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

app.get("/gateway-status", (req, res) => {
  res.status(200).json({ status: "alive", attribution: "SABER" });
});

// Implementation of proxy behavior
app.all("/api/v1/:service/:path*", async (req, res) => {
  const { service } = req.params;
  const serviceKey = service.toLowerCase();
  const targetBase = serviceMap[serviceKey];

  console.log(`[Gateway-DEBUG] Incoming: ${req.method} ${req.url}`);
  console.log(
    `[Gateway-DEBUG] Parsed Service: ${service} -> Key: ${serviceKey}`,
  );

  if (!targetBase) {
    console.warn(`[Gateway-WARN] Service ${serviceKey} NOT found in map!`);
    return res
      .status(404)
      .json({ error: `Service ${service} not found in gateway map` });
  }

  // Robust path reconstruction
  // Extract everything after /api/v1/:service
  const urlParts = req.url.split("/");
  // /api/v1/:service/the/rest/of/path?query=1
  // parts: ["", "api", "v1", ":service", "the", "rest", "..."]
  const pathWithQuery = urlParts.slice(4).join("/");
  const targetUrl = `${targetBase.replace(/\/$/, "")}/${pathWithQuery}`;

  console.log(`[Proxy] ${req.method} ${req.url} -> ${targetUrl}`);

  try {
    const cleanedHeaders = { ...req.headers };
    delete cleanedHeaders.host;
    const contentType = req.headers["content-type"] || "";

    // For non-multipart requests, remove content-length so axios can recalculate it correctly
    if (!contentType.includes("multipart/form-data")) {
      delete cleanedHeaders["content-length"];
    }

    console.log(`[Proxy] Content-Type: ${contentType}`);

    // For multipart/form-data, use pipe to avoid body parsing issues
    if (contentType.includes("multipart/form-data")) {
      console.log(`[Proxy] Handling as Multipart Stream`);
      const proxyReq = axios({
        method: req.method,
        url: targetUrl,
        headers: {
          ...cleanedHeaders,
          host: new URL(targetBase).host,
        },
        responseType: "stream",
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: () => true,
        data: req, // Pipe the request stream directly
      });

      const response = await proxyReq;

      // Pipe response back
      res.status(response.status);
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value as string);
      });
      response.data.pipe(res);
      return;
    }

    // For JSON and others, use standard handling
    const axiosConfig: any = {
      method: req.method,
      url: targetUrl,
      headers: {
        ...cleanedHeaders,
        host: new URL(targetBase).host,
      },
      responseType: "arraybuffer", // Use arraybuffer to preserve binary data fully
      validateStatus: () => true,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 300000, // Increased to 5 minutes
    };

    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      axiosConfig.data = req.body;
    }

    let response;
    let lastError;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        response = await axios(axiosConfig);
        break;
      } catch (error: any) {
        lastError = error;
        const isNetworkError =
          error.code === "ECONNREFUSED" ||
          error.code === "ETIMEDOUT" ||
          error.code === "ENOTFOUND" ||
          error.message.includes("Network Error");

        if (isNetworkError && attempts < maxAttempts) {
          console.warn(
            `[Proxy] Retry ${attempts}/${maxAttempts} for ${targetUrl} (${error.code || error.message})`,
          );
          // Wait before retry: 200ms, 600ms
          await new Promise((resolve) => setTimeout(resolve, attempts * 400));
          continue;
        }
        throw error;
      }
    }

    if (!response) throw lastError;

    // Pass headers down perfectly, ensuring content-types mismatch don't happen
    Object.entries(response.headers).forEach(([key, value]) => {
      // Axios auto-decompresses responses, so we must remove the encoding headers to prevent browser decode errors
      if (
        key.toLowerCase() !== "content-encoding" &&
        key.toLowerCase() !== "transfer-encoding"
      ) {
        res.setHeader(key, value as string);
      }
    });

    res.status(response.status).send(response.data);
  } catch (error: any) {
    if (!res.headersSent) {
      console.error(
        `[Gateway] Final Proxy Error for ${targetUrl}:`,
        error.message,
      );
      res.status(500).json({
        error: "Gateway Proxy Error",
        message: error.message,
        target: targetUrl,
        banner: [
          "██╗   ██╗███╗   ██╗██╗███████╗",
          "██║   ██║████╗  ██║██║╚══███╔╝",
          "██║   ██║██╔██╗ ██║██║  ███╔╝ ",
          "██║   ██║██║╚██╗██║██║ ███╔╝  ",
          "╚██████╔╝██║ ╚████║██║███████╗",
          " ╚═════╝ ╚═╝  ╚═══╝╚═╝╚══════╝",
        ],
      });
    }
  }
});

app.use((req, res) => {
  console.log(`[Gateway] 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
    attribution: "SABER",
    banner: [
      "██╗   ██╗███╗   ██╗██╗███████╗",
      "██║   ██║████╗  ██║██║╚══███╔╝",
      "██║   ██║██╔██╗ ██║██║  ███╔╝ ",
      "██║   ██║██║╚██╗██║██║ ███╔╝  ",
      "╚██████╔╝██║ ╚████║██║███████╗",
      " ╚═════╝ ╚═╝  ╚═══╝╚═╝╚══════╝",
    ],
  });
});

const server = app.listen(PORT, () => {
  console.log(`Gateway API Service running on port ${PORT}`);
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
});

// Graceful Shutdown Handler
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Starting graceful shutdown...");
  server.close(() => {
    console.log("HTTP server closed.");
  });
  try {
    if ((global as any).prisma || require("./utils/db.util").prisma) {
      // generic attempt to close prisma if it exists
    }
  } catch (e) {}
  process.exit(0);
});
