<p align="center">
  <img width="1680" height="1050" alt="UniZ" src="https://raw.githubusercontent.com/uniz-rguktong/.github/main/profile/uniz.webp" />
</p>

<p align="center">
  <a href="https://uniz.rguktong.in"><b>UniZ</b></a> — open campus platform for RGUKT Ongole
</p>

<p align="center">
  Student &amp; admin portals · academics · grades · grievances · notifications · Android TWA<br/>
  TypeScript monorepo · Cloudflare Pages + single VPS (k3s) · PostgreSQL · Prisma · Redis · GitHub Actions
</p>

### Source of truth

| Repository | Purpose |
|---|---|
| **[uniz-master](https://github.com/uniz-rguktong/uniz-master)** | Entire product: APIs, portal, landing, docs, infra, Android TWA |
| **[uniz-hall-ticket](https://github.com/uniz-rguktong/uniz-hall-ticket)** | Standalone hall-ticket utility |
| **[.github](https://github.com/uniz-rguktong/.github)** | Organization profile & community defaults |

Production topology: **Cloudflare Pages** serves portal/landing; the **VPS** runs `gateway-api` → microservices, Postgres, Redis, docs, and localhost-only observability. No always-on legacy monolith.

The Android client is **not** a separate app repo. It lives in `uniz-master` as a Trusted Web Activity (`apps/uniz-android-twa`). Build with `npm run android:apk`; students download from [uniz.rguktong.in/download/uniz.apk](https://uniz.rguktong.in/download/uniz.apk).

### Start here

1. Clone [uniz-master](https://github.com/uniz-rguktong/uniz-master)
2. Read [STRUCTURE.md](https://github.com/uniz-rguktong/uniz-master/blob/main/STRUCTURE.md) and the [ops index](https://github.com/uniz-rguktong/uniz-master/blob/main/docs/ops/INDEX.md)
3. Local setup: [CONTRIBUTING.md](https://github.com/uniz-rguktong/uniz-master/blob/main/CONTRIBUTING.md)

### Contribute

UniZ is built by students across RGUKT. New here? Start with a [good first issue](https://github.com/uniz-rguktong/uniz-master/issues?q=is%3Aopen+label%3A%22good+first+issue%22), read [CONTRIBUTING](https://github.com/uniz-rguktong/.github/blob/main/CONTRIBUTING.md), and ask questions in [Discussions](https://github.com/uniz-rguktong/uniz-master/discussions).

### Links

- Portal: [uniz.rguktong.in](https://uniz.rguktong.in)
- Landing: [rguktong.in](https://rguktong.in)
- Docs: [api-uniz.rguktong.in/docs](https://api-uniz.rguktong.in/docs)
- Security: report privately per [SECURITY.md](https://github.com/uniz-rguktong/.github/blob/main/SECURITY.md)
