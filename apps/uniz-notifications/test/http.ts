import http from "node:http";
import express, { type Router } from "express";

export function request(
  app: express.Express,
  method: string,
  path: string,
  options: { headers?: Record<string, string>; body?: unknown } = {},
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Test server did not bind a port"));
        return;
      }

      const payload =
        options.body === undefined ? undefined : JSON.stringify(options.body);
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port: address.port,
          path,
          method,
          headers: {
            ...(payload
              ? {
                  "content-type": "application/json",
                  "content-length": Buffer.byteLength(payload),
                }
              : {}),
            ...(options.headers || {}),
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            server.close();
            const text = Buffer.concat(chunks).toString("utf8");
            let body: unknown = text;
            try {
              body = text ? JSON.parse(text) : null;
            } catch {
              body = text;
            }
            resolve({ status: res.statusCode || 0, body });
          });
        },
      );
      req.on("error", (err) => {
        server.close();
        reject(err);
      });
      if (payload) req.write(payload);
      req.end();
    });
  });
}

export function mount(router: Router) {
  const app = express();
  app.use(express.json());
  app.use(router);
  return {
    get: (path: string, headers?: Record<string, string>) =>
      request(app, "GET", path, { headers }),
    post: (path: string, body?: unknown, headers?: Record<string, string>) =>
      request(app, "POST", path, { body, headers }),
    patch: (path: string, body?: unknown, headers?: Record<string, string>) =>
      request(app, "PATCH", path, { body, headers }),
    del: (path: string, headers?: Record<string, string>) =>
      request(app, "DELETE", path, { headers }),
  };
}
