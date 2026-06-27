# Test Tracker

## Current Coverage

| Area | Status | Notes |
|---|---|---|
| Shared schema validation | Done | Covers applicant profile, learned-answer, run, prompt, live-event, and API-contract acceptance/rejection cases. |
| Shared normalization helpers | Done | Covers whitespace collapse, punctuation stripping, label normalization, hostname cleanup, and nearby-context cleanup. |
| Shared field alias vocabulary | Done | Verifies canonical field coverage, representative aliases, and lowercase alias invariants. |
| TypeScript project references | Done | Verified by the root `typecheck` command after Phase 2 shared-contract additions. |
| Application behavior tests | Not Started | API, persistence, resolver, browser, and UI behavior remain deferred until later runtime phases. |

## Known Gaps

- No API route integration tests exist yet because Fastify routes have not been implemented.
- No persistence, resolver, browser, or UI behavior tests exist yet because those phases have not started.
- No export-specific smoke test exists for `packages/shared/src/index.ts`; current coverage exercises exports indirectly through direct imports.
