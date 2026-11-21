import http from "http";
import https from "https";
import { URL } from "url";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { accessCertsUrl, accessIssuer, decideAccess, readAccessToken } from "./access/claims";

const team = (process.env.CF_ACCESS_TEAM_DOMAIN || "").trim();
const aud = (process.env.CF_ACCESS_AUD || "").trim();
const upstream = new URL(process.env.ADMINER_UPSTREAM || "http://127.0.0.1:8080");
const port = Number(process.env.PORT || 4180);

if (!aud) {
  console.error("[adminer-access] CF_ACCESS_AUD is not set");
  process.exit(1);
}

const issuer = accessIssuer(team);
const jwks = createRemoteJWKSet(accessCertsUrl(team));

async function verify(token: string): Promise<{ iss?: string; aud?: string | string[] }> {
  const { payload } = await jwtVerify(token, jwks, {
    issuer,
    audience: aud,
    clockTolerance: "30s",
  });
  return audienceOf(payload);
}

function audienceOf(payload: JWTPayload): { iss?: string; aud?: string | string[] } {
  const audClaim = payload.aud;
  const audValue = Array.isArray(audClaim)
    ? audClaim.filter((item): item is string => typeof item === "string")
    : typeof audClaim === "string"
      ? audClaim
      : undefined;
  return {
    iss: typeof payload.iss === "string" ? payload.iss : undefined,
    aud: audValue,
  };
}

function headerBag(req: http.IncomingMessage): Record<string, string | string[] | undefined> {
  const headers: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(req.headers)) headers[key.toLowerCase()] = value;
  return headers;
}

const transport = upstream.protocol === "https:" ? https : http;

const server = http.createServer((req, res) => {
  void decideAccess(readAccessToken(headerBag(req)), verify, issuer, aud)
    .then((allowed) => {
      if (!allowed) {
        res.writeHead(401, {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
        });
        res.end("Sign in through Cloudflare Access to open this database tool.");
        return;
      }
      const headers: http.OutgoingHttpHeaders = { ...req.headers, host: upstream.host };
      delete headers["cf-access-jwt-assertion"];
      const proxy = transport.request(
        {
          protocol: upstream.protocol,
          hostname: upstream.hostname,
          port: upstream.port,
          method: req.method,
          path: req.url,
          headers,
        },
        (upstreamRes) => {
          res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
          upstreamRes.pipe(res);
        },
      );
      proxy.on("error", () => {
        if (res.headersSent) return;
        res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
        res.end("The database tool is not reachable.");
      });
      req.pipe(proxy);
    })
    .catch(() => {
      if (res.headersSent) return;
      res.writeHead(401, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      res.end("Sign in through Cloudflare Access to open this database tool.");
    });
});

server.listen(port, () => {
  console.log(`[adminer-access] checking Cloudflare Access JWTs on port ${port}`);
});
