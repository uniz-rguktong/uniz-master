# UniZ UI Guidance

Campus user and trainer guide for portal UI features and actions by role.

| Artifact | Path |
| --- | --- |
| Word document | `UniZ-UI-Guidance.docx` |
| Markdown source | `UniZ-UI-Guidance.md` |
| Generator | `generate_guide.py` |
| Screenshots | `screenshots/` |

Technical API and flow docs (not this guide):

- https://api-uniz.rguktong.in/docs
- https://api-uniz.rguktong.in/docs/system/action-flows

## Regenerate

```bash
pip install python-docx
python3 docs/guides/generate_guide.py
```

Inventory sources: `apps/uniz-portal/src/App.tsx`, role dashboards under `pages/admin/` and `pages/faculty/`, student `Sidebar.tsx`, and `apps/uniz-docs/`.
