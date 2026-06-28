# Test Tracker

## Current Coverage

| Area | Status | Notes |
|---|---|---|
| Shared schema validation | Done | Covers applicant profile, learned-answer, run, prompt, live-event, and API-contract acceptance/rejection cases. |
| Shared normalization helpers | Done | Covers whitespace collapse, punctuation stripping, label normalization, hostname cleanup, and nearby-context cleanup. |
| Shared field alias vocabulary | Done | Verifies canonical field coverage, representative aliases, and lowercase alias invariants. |
| TypeScript project references | Done | Verified by the root `typecheck` command after Phase 2 shared-contract additions. |
| Server runtime path configuration | Done | Covers default local data paths, relative overrides, absolute overrides, and allowed resume path parsing. |
| SQLite connection and migration runner | Done | Covers database directory creation, foreign-key enforcement, repeat migration application, migration recording, and duplicate migration id rejection. |
| Initial SQLite schema | Done | Covers table creation, repeat migration application, run/prompt/step/screenshot foreign keys, current prompt integrity, cascade cleanup, and screenshot metadata columns. |
| Profile repository | Done | Covers empty reads, profile upsert persistence, shared-schema normalization and validation, timestamp preservation, and invalid stored profile rejection. |
| Memory repository | Done | Covers learned-answer create/list, update, soft disable, last-used updates, missing-record behavior, shared-schema validation, and invalid stored answer rejection. |
| Run repository | Done | Covers run lifecycle timestamps, current prompt tracking, prompt answers, step history, latest-step reads, screenshot metadata, missing-record behavior, and invalid stored prompt response rejection. |
| Server app bootstrap | Done | Covers app creation without listening on a port, migration application, repository wiring, in-memory run-event publishing, local listen option parsing, and invalid port rejection. |
| Server API routes | Done | Covers profile read/update, memory list/patch, run creation/status, prompt response persistence, invalid payloads, missing resources, run/prompt mismatch rejection, structured errors, and SSE event delivery. |
| Resolver decision logic | Done | Covers profile alias resolution, split-name handling, missing split-name values, learned-answer strong matches, disabled memory exclusion, host/path/context mismatch behavior, option compatibility, low-confidence prompts, open-ended prompt behavior, and resolver ordering. |
| Browser service configuration | Done | Covers configured persistent profile path, visible default launch mode, headless test override, URL validation, and screenshot reason sanitization without launching a real browser. |
| Generic DOM adapter tests | Done | Synthetic form tests cover scanner descriptors, label/context extraction, option extraction, safe fills, prompt/skip non-mutation, metadata sanitization, and continuation classification. These tests execute when Playwright Chromium can launch locally; they skip without a browser binary. |
| Run manager and prompt bridge orchestration | Done | Covers unknown-field prompt creation, no fill before prompt response, prompt response resume, prompt-response fill path, save-for-reuse opt in/out, later learned-answer reuse, `lastUsedAt` updates, event status ordering, failure handling, and cancellation state. |
| Prompt response route integration | Done | Covers route delegation through the run manager and prompt bridge while preserving prompt ownership validation and SSE event delivery. |
| Final-submit safety and step navigation tests | Done | Covers final-submit/apply/finish/complete/send/done classification, review and ambiguous classification, adapter guard no-click behavior, stop-before-submit review steps, privacy-safe review metadata, explicit one-step advance, blocked final-only advance, and advance route errors. Dashboard UI remains deferred to Phase 9. |

## Known Gaps

- Synthetic browser-driving adapter tests are blocked inside the Codex sandbox because Chromium cannot register its macOS Mach port from this environment. Run `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm test` in a normal local terminal to execute them.
- Manual visible-browser verification of Phase 8 final-submit stop and one-step advance remains needed outside the Codex sandbox.
- Real socket listener lifecycle is not covered in automated tests because the sandbox blocks binding to `127.0.0.1`; Fastify in-process injection covers route behavior.
