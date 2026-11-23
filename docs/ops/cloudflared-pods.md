# In-cluster cloudflared connectors: parked (Nov 22, 2026)

## Status

- k8s cloudflared deployment: 0 replicas, on purpose.
- `CLOUDFLARE_TUNNEL_TOKEN` is empty in the VPS vault and the k8s secret `uniz-secrets`. Keep it empty: deploy scales the pods to 2 when the token is set.
- The host connector (systemd `cloudflared`, token in `/etc/cloudflared/token.env`, mode 600) is the only live connector and handles current load (120 rps load test: p95 235 ms, 0 errors).

## What happened

From 5:51 to 6:34 PM IST on Nov 22 the token was set and 2 pods registered. About 60-70% of API requests (`api-uniz`, `landing-api`) returned 503 until the pods were scaled to 0. Pages sites were unaffected.

## Root cause

The tunnel takes its routing rules from the host's local `/etc/cloudflared/config.yml` (Cloudflare shows config source `local`). The rules stored in Cloudflare send everything to `http_status:503`. The pods ran on the token alone with no local config, so every request routed to a pod got 503.

## Fix before re-enabling (needs a PR and owner approval)

1. Mount the host's `/etc/cloudflared/config.yml` read-only into the pods (hostPath) and run `cloudflared tunnel --config <path> run`, so pods route like the host.
2. Add a health gate to `setup-cloudflare-tunnel.sh`: after scaling up, send ~20 public requests through the tunnel and scale back to 0 if any returns 503.
3. Only then put the token back into the vault and k8s secret. Watch the error rate for 10 minutes; keep the host connector as fallback.

Alternative (riskier): move routing rules into Cloudflare's remote config. That also changes how the host connector behaves.

## Not needed until

Traffic grows well past current load, or the host connector becomes a single point of failure we care about.
