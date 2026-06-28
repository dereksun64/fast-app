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
| Application behavior tests | Not Started | API, persistence, resolver, browser, and UI behavior remain deferred until later runtime phases. |

## Known Gaps

- No API route integration tests exist yet because Fastify routes have not been implemented.
- No API route, resolver, browser, or UI behavior tests exist yet because those runtime behaviors have not started.
- No export-specific smoke test exists for `packages/shared/src/index.ts`; current coverage exercises exports indirectly through direct imports.
