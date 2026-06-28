# Local Runtime Paths

All sensitive runtime data stays local and must remain ignored by version control.

| Path | Purpose | Notes |
|---|---|---|
| `data/app.db` | Local SQLite database | Phase 3 will create and manage this file. |
| `data/browser-profile/` | Persistent browser session data | Used by visible Playwright sessions. |
| `data/logs/` | Structured local logs | Keep logs free of unnecessary personal data. |
| `data/screenshots/` | Review and failure screenshots | Capture only when needed and avoid storing unnecessary PII. |
| `data/resumes/` | Local resume files | Treat resume content as sensitive operator data. |

## Server Configuration

The server centralizes these paths in `apps/server/src/config/runtime-paths.ts`.

| Environment variable | Default |
|---|---|
| `FAST_APP_PROJECT_ROOT` | Repository root detected from the server module location |
| `FAST_APP_DATABASE_PATH` | `data/app.db` |
| `FAST_APP_BROWSER_PROFILE_PATH` | `data/browser-profile/` |
| `FAST_APP_LOGS_PATH` | `data/logs/` |
| `FAST_APP_SCREENSHOTS_PATH` | `data/screenshots/` |
| `FAST_APP_ALLOWED_RESUME_PATHS` | `data/resumes/` |

Relative override paths are resolved from `FAST_APP_PROJECT_ROOT`. `FAST_APP_ALLOWED_RESUME_PATHS` accepts a comma-separated list.

## Privacy Notes

- Do not commit any files under `data/`.
- Do not log full resumes or unnecessary personal information.
- Prefer storing file paths and small metadata over embedded document contents.
- Browser screenshots should be local-only files referenced by path metadata, not embedded blobs or API payloads.

## Browser Notes

Phase 6 uses `data/browser-profile/` as the default Playwright persistent profile directory. Install Chromium locally with `npx playwright install chromium` before manual visible-browser verification. Operators should perform any job-site login in the visible browser window so the persistent profile can reuse that local session.
