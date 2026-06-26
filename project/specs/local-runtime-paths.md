# Local Runtime Paths

All sensitive runtime data stays local and must remain ignored by version control.

| Path | Purpose | Notes |
|---|---|---|
| `data/app.db` | Local SQLite database | Phase 3 will create and manage this file. |
| `data/browser-profile/` | Persistent browser session data | Used later for visible Playwright sessions. |
| `data/logs/` | Structured local logs | Keep logs free of unnecessary personal data. |
| `data/screenshots/` | Review and failure screenshots | Capture only when needed and avoid storing unnecessary PII. |
| `data/resumes/` | Local resume files | Treat resume content as sensitive operator data. |

## Privacy Notes

- Do not commit any files under `data/`.
- Do not log full resumes or unnecessary personal information.
- Prefer storing file paths and small metadata over embedded document contents.
