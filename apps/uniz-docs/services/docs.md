---
title: Docs service (VitePress)
description: In-house UniZ docs — VitePress static site served at /docs.
---

## Role

In-house VitePress documentation for UniZ operators and API consumers. No Mintlify runtime.

| | |
|--|--|
| **Code** | `apps/uniz-docs/` |
| **Config** | `.vitepress/config.mts` (navigation) |
| **Build** | `npm run build` → static HTML |
| **K8s** | `uniz-docs-service:3333` (nginx) |
| **Public URL** | `https://api-uniz.rguktong.in/docs` |

## Runtime

Docker multi-stage build:

1. `vitepress build` produces `.vitepress/dist`
2. nginx serves static files on port `3333`
3. Gateway / Traefik proxies `/docs` → docs Service
4. Health: `GET /health` returns JSON immediately

Cold compile is ~15–20s locally. Runtime is static — no live MDX compiler.

## How to edit these docs

1. Edit Markdown under `apps/uniz-docs/` (`.md` files)
2. Register the page in `.vitepress/config.mts` sidebar
3. Preview: `cd apps/uniz-docs && npm run dev`
4. Commit & push — VPS deploy rebuilds `uniz-docs-service` when docs paths change
5. Keep [search-index](/search-index) updated when adding major topics

## Writing standards

- YAML frontmatter: `title`, `description` (searchable)
- Prefer Mermaid for architecture
- Link to **file paths** so “how was this implemented?” is grep-friendly
- Flag production-gated features (outpass) clearly
- Use VitePress containers: `::: info`, `::: tip`, `::: warning`
