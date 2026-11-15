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

## Cursor Cloud environment

Committed at `.cursor/environment.json` + `.cursor/Dockerfile` (Node 22, `npm ci`, portal terminal on :5173).

- Branch for UI work: `polish/ui-screen-by-screen`
- Dashboard: https://cursor.com/dashboard?tab=cloud-agents
- Point the environment’s environment.json location at this repo file if creating a saved Environment
- Do not start UI polish until you (or GrokBot) explicitly ask for a screen
