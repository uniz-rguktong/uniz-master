## What and why

<!-- 2-3 sentences. Link the issue: Closes #123 -->

## How I tested it

<!-- Commands you ran, pages you clicked through. Screenshots for UI changes. -->

## Checklist

- [ ] PR title follows Conventional Commits (`fix(portal): ...`, `feat(api): ...`)
- [ ] One focused change, no unrelated formatting
- [ ] `npm run build:shared && npm run ci:build` passes
- [ ] `npm run build -w uniz` passes (if the portal changed)
- [ ] `npm test -w @uniz/shared` passes (if shared changed), tests added where it makes sense
- [ ] No secrets, `.env` files or real student data
- [ ] Requested review from a code owner. Don't merge your own PR.
