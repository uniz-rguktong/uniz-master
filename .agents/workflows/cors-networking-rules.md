---
description: How we handle API URLs, CORS, and proxying in development and production
---

# CORS & Networking Rules Workflow

To permanently eliminate CORS errors and simplify debugging, we have adopted a strict **Proxy-Only Networking Architecture**. Follow these rules whenever adding new endpoints, services, or making changes to the UI's API calls.

## 1. NEVER Use Absolute URLs in the Frontend

**Rule**: Do not hardcode `https://api.uniz.rguktong.in` or `http://localhost:3000` anywhere in the frontend React codebase.

- **Why**: Making cross-origin requests immediately triggers browser CORS policies, preflight requests (`OPTIONS`), and requires complex header management. It is brittle and error-prone.
- **Instead**: ALWAYS use relative paths (e.g., `/api/v1/user/profile`) or import `BASE_URL` from `src/api/endpoints.ts`.

## 2. `.env` and `.env.local` Configuration

The main environment file must use relative paths:

```env
# apps/uniz-portal/.env
VITE_API_URL=/api/v1
```

For local development OVERRIDES, we use `.env.local` (which is gitignored):

```env
# apps/uniz-portal/.env.local
VITE_API_URL=/api/v1
```

_Note: Because `VITE_API_URL` is relative, `.env` and `.env.local` look mostly identical right now. This is intentional. The magic happens in the dev server config._

## 3. How the Proxies Work

### A. Local Development (Vite)

When running `npm run dev`, Vite starts a dev server on `http://localhost:5173`.
To prevent the browser from blocking requests to `http://localhost:3000` (the gateway), Vite transparently proxies them:

1. Browser requests `http://localhost:5173/api/v1/auth/login`. (Same-origin: ✅ No CORS).
2. The Vite dev server (`vite.config.ts`) catches any `/api/*` request.
3. Vite makes a server-side HTTP call to `https://api.uniz.rguktong.in` (Target specified in `vite.config.ts`).
4. Vite returns the response to the browser.

### B. Production Environment (Nginx in Kubernetes)

When deployed to K3s, the React bundle is served by an Nginx container. Nginx uses a `location` block to do the exact same proxying Vite does in dev:

1. User visits `https://uniz.rguktong.in`.
2. Browser makes a fetch request to `/api/v1/auth/login`. (Same-origin: ✅ No CORS).
3. The Portal Nginx container intercepts the request via `location /api/v1/`.
4. Nginx proxies the request internally to `http://uniz-gateway-api:3000/api/v1/` using Kubernetes DNS.
5. No SSL handshake required inside the cluster = lower latency and no 502 Bad Gateway proxy errors.

## 4. Troubleshooting Steps if "CORS" Returns

Since requests are structurally same-origin, true CORS issues are technically impossible. If you see a "CORS error" in the browser, it is a **false flag**. What actually happened is the server proxy failed.

1. **Check Nginx Proxy:**
   Ensure the `nginx.conf` in `apps/uniz-portal/nginx.conf` has the correct `location /api/v1/` block pointing to `http://uniz-gateway-api:3000/api/v1/`.
2. **Check for Hardcoded URLs:**
   Search the codebase: `grep -rn "api.uniz.rguktong.in" apps/uniz-portal/src/`. If any results appear, refactor them immediately to use `BASE_URL`.
3. **Check Browser Cache (Stale HTML trick):**
   Sometimes the gateway goes down and Nginx serves a 502 HTML error page. The browser heavily caches this HTML response. When the API comes back up, the browser still loads the cached HTML but expects JSON, throwing confusing syntax or policy errors.
   **Fix**: Have the user "Empty Cache and Hard Reload". (Nginx must also set `Cache-Control: no-store` on all `/api/v1/` blocks).
4. **Duplicate Headers:**
   Make sure neither Express (`cors()`) nor the K8s Ingress (`nginx.ingress.kubernetes.io/enable-cors`) are actively injecting CORS headers into the response. Since we proxy via same-origin, these headers are no longer needed and will cause "Multiple Access-Control-Allow-Origin" errors.
