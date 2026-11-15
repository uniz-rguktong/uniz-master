# Agent / GrokBot notes — UI screen pass

This folder’s `UI-SCREEN-PASS.md` is the backlog for branch **`polish/ui-screen-by-screen`**.

## Do

- One screen per PR when possible
- Start at **1.1 Webmaster overview** unless told otherwise
- Match `portal-ui.ts` / AdminShell patterns
- Push PRs to `main` from this branch (or stacked short-lived branches off it)

## Don’t

- Do not treat the Elaya home as finishing the portal UI
- Do not use production credentials
- Do not rewrite unrelated services

## Live

https://uniz.rguktong.in

## Cursor Cloud environment (Grok Bot)

Committed: `.cursor/environment.json` + `.cursor/Dockerfile` (Node 22, `npm ci`, portal `:5173`).

| Item | Value |
| --- | --- |
| Saved environment **name** (exact) | `UniZ portal` |
| Repo | `uniz-rguktong/uniz-master` |
| Branch | `polish/ui-screen-by-screen` |
| Dashboard | https://cursor.com/dashboard?tab=cloud-agents |
| Backlog | `docs/guides/UI-SCREEN-PASS.md` |

### One-time: create the saved environment (this Cursor account)

1. Sign into https://cursor.com/dashboard?tab=cloud-agents with the **same Cursor account** you use for Grok Bot.
2. Confirm GitHub is connected and can see `uniz-rguktong/uniz-master`.
3. Create / save an environment named exactly **`UniZ portal`**.
4. Attach repo `uniz-rguktong/uniz-master`.
5. Set environment.json location to this repo’s `.cursor/environment.json` (not None).
6. Run a Build once so install + snapshot succeed.

Grok Bot cannot browse your environment list; it needs that **exact** name.

### Paste into Grok Bot

```
Use my Cursor Cloud Agents saved environment named exactly "UniZ portal"
(repo uniz-rguktong/uniz-master, branch polish/ui-screen-by-screen).

Do NOT polish UI yet. First: list that environment if you can, confirm
.cursor/environment.json is in use, and that a Build exists. Then wait
for me to name a screen from docs/guides/UI-SCREEN-PASS.md.
```

When ready for real UI work, append e.g.:

```
Launch a Cursor cloud agent in environment "UniZ portal" on branch
polish/ui-screen-by-screen. Do screen 1.1 Webmaster overview only —
follow docs/guides/UI-SCREEN-PASS.md and UI-SCREEN-PASS.AGENTS.md.
One PR. No prod credentials.
```
