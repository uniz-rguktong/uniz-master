# Documentation project instructions

## About this project

- Mintlify docs for UniZ (`apps/uniz-docs`)
- Config: `docs.json`
- Preview: `npx mintlify dev`
- Validate: `npx mintlify broken-links` / `npx mintlify validate`
- Public URL (prod): `https://api-uniz.rguktong.in/docs`

## Terminology

- **Portal** — student/admin/faculty SPA (`uniz.rguktong.in`, Cloudflare Pages)
- **Landing** — public college site (`rguktong.in`, Pages + landing-api)
- **gateway-api** — Express router (`uniz-gateway-api`); not the parked nginx `uniz-gateway`
- **Folded** — mail→notifications, files→user, grievance→user
- **Parked** — Deployment replicas 0 (rollback retained)

## Style

- Active voice, second person
- Sentence case headings
- Always include `description` frontmatter (search)
- Prefer Mermaid for architecture
- Cite repo paths (`apps/...`, `scripts/...`) so operators can grep
- Mark production-gated features with `<Warning>`

## When adding pages

1. Create MDX
2. Register in `docs.json`
3. Add a row to `search-index.mdx`
4. Link from the relevant service/how-to page
