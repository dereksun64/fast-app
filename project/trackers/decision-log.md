# Decision Log

## 2026-06-26 - Phase 1 workspace foundation

- Status: Accepted
- Context: The repository needed a minimal monorepo foundation before any runtime behavior could be added.
- Decision:
  - Use npm workspaces at the root for `apps/*` and `packages/*`.
  - Use TypeScript project references to keep server, client, and shared builds separate.
  - Use root `tsc -b` as the default build entry point so referenced packages build in dependency order.
  - Keep Phase 1 runtime code limited to placeholder entry points only.
  - Use Vitest for tooling smoke checks because it runs TypeScript tests with low setup overhead.
- Consequences:
  - The repository now has a small installable workspace skeleton without leaking into later phases.
  - Future phases can add Fastify, React, Playwright, SQLite, and Zod on top of an existing workspace boundary.

## 2026-06-27 - Phase 2 shared contracts and field vocabulary

- Status: Accepted
- Context: The repository needed a single shared contract layer before persistence, routes, resolver logic, or UI state handling could be built safely.
- Decision:
  - Use Zod schemas in `packages/shared` as the canonical source of truth for profile, learned-answer, run, prompt, live-event, and API transport payloads.
  - Export inferred TypeScript types from those schemas through the shared package entry point instead of duplicating interfaces on the server or client side.
  - Use string unions over enums for run states, prompt states, answer types, control types, and event types.
  - Keep field aliases and normalization helpers in shared code so later matching logic can rely on one stable vocabulary and one deterministic normalization layer.
  - Keep normalization helpers pure and composable rather than combining them into resolver-specific matching logic during Phase 2.
- Consequences:
  - Future server routes, repositories, resolvers, and client API helpers can build on a consistent shared contract surface.
  - Invalid transport and workflow states are now rejected earlier in tests and, later, at runtime boundaries.
  - Later phases can focus on behavior and persistence without redefining profile, memory, run, prompt, or event payloads.

## 2026-06-28 - Phase 3 server runtime path configuration

- Status: Accepted
- Context: SQLite persistence needs one server-owned source of truth for sensitive local runtime paths before database connection and repository code are added.
- Decision:
  - Add `apps/server/src/config/runtime-paths.ts` as the central path configuration module.
  - Default database, browser profile, logs, screenshots, and resume roots to the local `data/` paths documented in `project/specs/local-runtime-paths.md`.
  - Allow environment overrides with `FAST_APP_PROJECT_ROOT`, `FAST_APP_DATABASE_PATH`, `FAST_APP_BROWSER_PROFILE_PATH`, `FAST_APP_LOGS_PATH`, `FAST_APP_SCREENSHOTS_PATH`, and `FAST_APP_ALLOWED_RESUME_PATHS`.
  - Resolve relative overrides from the configured project root and keep absolute overrides absolute.
- Consequences:
  - Later database, browser, logging, screenshot, and resume validation code can share one path source instead of duplicating path logic.
  - Sensitive runtime data remains local by default while still allowing tests and local operators to redirect storage safely.

## 2026-06-28 - Phase 3 SQLite connection and migrations

- Status: Accepted
- Context: Persistence needs a small server-side database boundary before schema and repositories are added.
- Decision:
  - Declare `better-sqlite3` as the server SQLite dependency and `@types/better-sqlite3` for TypeScript coverage.
  - Add `apps/server/src/db/sqlite.ts` to open SQLite database files and enable `PRAGMA foreign_keys = ON` on each connection.
  - Add `apps/server/src/db/migrations.ts` with ordered migration application and a `schema_migrations` table.
  - Record each migration by stable text id, name, and applied timestamp, and skip already-applied migrations on later runs.
- Consequences:
  - Future repositories can depend on one connection helper instead of opening SQLite directly.
  - Foreign key constraints will protect run, prompt, step, and screenshot relationships once the initial schema lands.
  - Migration tests can use temporary database files without touching local operator data.

## 2026-06-28 - Phase 3 initial SQLite schema

- Status: Accepted
- Context: The persistence layer needs durable tables before repositories can store shared-contract data.
- Decision:
  - Add the first app migration as `001-initial-schema`.
  - Store applicant profile data in one `applicant_profiles` row as validated JSON so the repository can keep the shared `ApplicantProfile` schema as the boundary.
  - Store learned answers as queryable columns for label, control type, host, state, answer type, timestamps, and JSON answer value.
  - Store runs, prompts, run steps, and screenshot metadata in separate tables with foreign keys.
  - Store screenshot file paths and small metadata only, not image blobs.
- Consequences:
  - Later repositories can validate rows against shared schemas while still using SQL indexes for common lookup fields.
  - Run history, prompt history, step history, and screenshot metadata are connected by database constraints.
  - Sensitive document and screenshot contents remain outside the database.

## 2026-06-28 - Phase 3 profile repository

- Status: Accepted
- Context: Profile persistence needs a small repository boundary before API routes or workflow code read applicant data.
- Decision:
  - Add `apps/server/src/profile/profile-repository.ts` with `getProfile` and `updateProfile`.
  - Store the single local applicant profile in the `applicant_profiles` row with id `default`.
  - Validate incoming and loaded profile JSON with the shared `applicantProfileSchema`.
  - Preserve `created_at` across updates and refresh `updated_at` on each save.
- Consequences:
  - Future route and workflow code can work with `ApplicantProfile` objects without knowing SQL details.
  - Invalid profile data fails at the persistence boundary instead of leaking into browser automation or matching logic.

## 2026-06-28 - Phase 3 memory repository

- Status: Accepted
- Context: Learned-answer persistence needs durable storage for user-confirmed answers before resolver or prompt-flow behavior can reuse them.
- Decision:
  - Add `apps/server/src/memory/memory-repository.ts` with list, create, update, disable, and mark-used methods.
  - Store learned-answer lookup fields as SQL columns and the answer value itself as JSON paired with `answer_type`.
  - Validate created, updated, and loaded records with the shared `learnedAnswerSchema`.
  - Soft disable learned answers by setting `state = 'disabled'` instead of deleting rows.
- Consequences:
  - Future matching code can query learned-answer metadata without exposing SQL outside the repository.
  - Disabled answers remain auditable and editable from a later UI.
  - Last-used timestamps make automatic reuse observable without logging answer contents.

## 2026-06-28 - Phase 3 run repository

- Status: Accepted
- Context: Application runs, prompts, steps, and screenshot metadata need durable storage before API routes and runner orchestration are added.
- Decision:
  - Add `apps/server/src/runner/run-repository.ts` with methods for run creation, status updates, current prompt tracking, prompt persistence and answering, step history, and screenshot metadata.
  - Validate loaded runs, prompts, prompt responses, and run steps with shared schemas.
  - Set lifecycle timestamps in the repository when statuses move to `starting`, `completed`, `failed`, or `canceled`.
  - Keep screenshot records limited to file paths and metadata.
- Consequences:
  - Future routes and run-manager code can persist lifecycle state without writing SQL directly.
  - Prompt and step history remain queryable for operator review and debugging.
  - Phase 3 persistence is complete without adding API, UI, browser automation, or resolver behavior.
