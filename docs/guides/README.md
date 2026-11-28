# UniZ UI Guidance

Campus user and trainer guide for portal UI features and actions by role.

| Artifact | Path |
| --- | --- |
| Word document | `UniZ-UI-Guidance.docx` |
| PDF | `UniZ-UI-Guidance.pdf` |
| Markdown source | `UniZ-UI-Guidance.md` |
| Generator | `generate_guide.py` |
| Screenshots | `screenshots/` |

Prepared by **SreeCharan Desu** (UniZ · RGUKT Ongole).

Technical API and flow docs (not this guide):

- https://api-uniz.rguktong.in/docs
- https://api-uniz.rguktong.in/docs/system/action-flows

## Screenshots (public)

Captured against live production (`https://uniz.rguktong.in`). Last refresh: **28 November 2026** — Portal home (`01-home.png`), Student sign-in (`02-student-signin.png`), Developers (`03-developers.png`), Privacy (`04-privacy.png`), and Admin sign-in (`05-admin-signin.png`). Authenticated role shots remain “Live screenshot pending test account.”

## Regenerate

```bash
pip install python-docx
python3 docs/guides/generate_guide.py
```

Inventory sources: `apps/uniz-portal/src/App.tsx`, role dashboards under `pages/admin/` and `pages/faculty/`, student `Sidebar.tsx`, and `apps/uniz-docs/`.
