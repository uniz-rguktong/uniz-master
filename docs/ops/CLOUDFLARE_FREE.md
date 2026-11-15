# Cloudflare free-tier checklist

## What lives on Cloudflare today

| Host | Product | Project |
|---|---|---|
| `uniz.rguktong.in` / `www.uniz.rguktong.in` | Pages | `uniz-portal` |
| `rguktong.in` / `www.rguktong.in` | Pages | `uniz-landing` |
| `api-uniz.rguktong.in` | DNS → VPS | Traefik / gateway-api |

Ship frontends only via:

```bash
gh workflow run "Deploy Frontends to Cloudflare Pages" -f target=all
# or
bash scripts/deploy/deploy-cloudflare-pages.sh all
```

k3s `uniz-portal` / `uniz-landing` Deployments stay at **replicas: 0**.

## Free-tier hardening

- [ ] Orange-cloud proxy on public hostnames that should get CDN/WAF
- [ ] SSL/TLS mode **Full (strict)** with valid origin certs on the VPS
- [ ] Always Use HTTPS on
- [ ] Managed/free WAF rules enabled where available
- [ ] Turnstile site/secret keys set (login/forms)
- [ ] Do **not** put API behind paid Workers features — DNS A/AAAA to VPS is enough
- [ ] Pages production branch = `main`

## DNS helpers

```bash
bash scripts/deploy/ensure-cloudflare-www-dns.sh
bash scripts/deploy/cutover-frontends-to-pages-dns.sh   # only when cutting over
```
