<p align="center">
  <img width="1680" height="1050" alt="UniZ" src="https://raw.githubusercontent.com/uniz-rguktong/.github/main/profile/uniz.webp" />
</p>

<p align="center">
  <a href="https://uniz.rguktong.in"><b>UniZ</b></a> — open campus platform for RGUKT Ongole
</p>

<p align="center">
  Exam cell, attendance and admin · student &amp; faculty portals · grades · grievances · notifications · Android TWA<br/>
  TypeScript monorepo · Cloudflare Pages + single VPS (k3s) · PostgreSQL · Prisma · Redis · GitHub Actions
</p>

### Repositories

| Repository | Purpose |
|---|---|
| **[uniz-master](https://github.com/uniz-rguktong/uniz-master)** | Entire product: APIs, portal, landing, docs, infra, Android TWA |
| **[uniz-hall-ticket](https://github.com/uniz-rguktong/uniz-hall-ticket)** | Standalone hall-ticket utility |
| **[.github](https://github.com/uniz-rguktong/.github)** | Organization profile & community defaults |

Production: **Cloudflare Pages** for the UniZ portal (`uniz.rguktong.in`) and the college site (`rguktong.in`); **VPS** for `gateway-api` → microservices, Postgres (localhost/cni0 only), Redis, VitePress docs, SSH-tunnel observability. Legacy `uniz-api` monolith and the old `uniz-app` Android repo are gone — the TWA lives in `uniz-master/apps/uniz-android-twa`.

`rguktong.in` keeps the official RGUKT Ongole look (primary `#C00404`, nav/footer `#1b262c`, titles `#0f3057`, page `#f9f9f9`). UniZ is a small text link there, not the site brand. Webadmin can update that site from the UniZ portal. Portal sign-in uses Cloudflare Turnstile when configured.

### Start here

1. Clone [uniz-master](https://github.com/uniz-rguktong/uniz-master)
2. Read [STRUCTURE.md](https://github.com/uniz-rguktong/uniz-master/blob/main/STRUCTURE.md) · [ops index](https://github.com/uniz-rguktong/uniz-master/blob/main/docs/ops/INDEX.md) · [live docs](https://api-uniz.rguktong.in/docs) · [UI guide (trainers)](https://github.com/uniz-rguktong/uniz-master/blob/main/docs/guides/UniZ-UI-Guidance.docx)
3. Local setup: [CONTRIBUTING.md](https://github.com/uniz-rguktong/uniz-master/blob/main/CONTRIBUTING.md)

### Contribute

UniZ is built by students across RGUKT. Start with a [good first issue](https://github.com/uniz-rguktong/uniz-master/issues?q=is%3Aopen+label%3A%22good+first+issue%22), read [CONTRIBUTING](https://github.com/uniz-rguktong/.github/blob/main/CONTRIBUTING.md), ask in [Discussions](https://github.com/uniz-rguktong/uniz-master/discussions).

### Links

- Portal: [uniz.rguktong.in](https://uniz.rguktong.in)
- Landing: [rguktong.in](https://rguktong.in)
- Docs: [api-uniz.rguktong.in/docs](https://api-uniz.rguktong.in/docs)
- UI guide: [docs/guides](https://github.com/uniz-rguktong/uniz-master/tree/main/docs/guides)
- Security: [SECURITY.md](https://github.com/uniz-rguktong/.github/blob/main/SECURITY.md)
