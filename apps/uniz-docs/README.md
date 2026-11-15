# UniZ Docs (in-house VitePress)

Static documentation site at [api-uniz.rguktong.in/docs](https://api-uniz.rguktong.in/docs). Replaces Mintlify.

Architecture, APIs, deploy, and role how-tos live here. Campus **UI feature inventory** (screenshots + actions by role) is separate: [`docs/guides/`](../../docs/guides/).

## Develop

```bash
cd apps/uniz-docs
npm install
npm run dev
```

Open http://localhost:3333/docs/

## Build

```bash
npm run build
```

Output: `.vitepress/dist` (~15–20s). Served by nginx in Docker/K8s.

## Edit pages

1. Edit `.md` files in this folder
2. Add sidebar entries in `.vitepress/config.mts`
3. Preview with `npm run dev`

`docs.json` is legacy Mintlify config and is unused at runtime.
