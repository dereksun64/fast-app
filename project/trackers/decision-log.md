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

## 2026-06-28 - Phase 4 Fastify API bootstrap and routes

- Status: Accepted
- Context: The persistence repositories needed a local API boundary for the future dashboard without adding browser automation or resolver behavior early.
- Decision:
  - Add Fastify as the server web framework dependency because the README, implementation plan, and coding standards already selected Fastify for local API routing.
  - Add `createServerApp` as an app factory that validates runtime paths, opens SQLite, applies migrations, wires repositories, creates an in-memory event publisher, and registers routes without listening on a port.
  - Keep the server entry point limited to local startup with `127.0.0.1:4317` defaults and `FAST_APP_HOST` / `FAST_APP_PORT` overrides.
  - Keep route handlers thin and validate request/response payloads with shared Zod schemas.
  - Return structured API errors without echoing sensitive submitted values.
- Consequences:
  - API integration tests can use isolated temporary databases and Fastify in-process injection.
  - Server startup now fails early for invalid listen port or missing runtime path configuration.
  - Browser automation, resolver behavior, dashboard state, and prompt resume orchestration remain deferred.

## 2026-06-28 - Phase 4 stub runner and run event stream

- Status: Accepted
- Context: Phase 4 needs observable run creation and live status delivery before real browser workflow exists.
- Decision:
  - Add a stub runner that creates a pending run, records an initial step, and publishes shared `RunEvent` payloads.
  - Do not launch Playwright, scan pages, fill fields, click controls, or submit applications in Phase 4.
  - Use an in-memory event publisher for v1 local run events.
  - Expose `GET /runs/:id/events` as a Server-Sent Events endpoint that serializes shared `RunEvent` payloads.
  - End the SSE stream on terminal run status events or run errors.
- Consequences:
  - The future dashboard can observe status and prompt-answer events without polling.
  - Event payloads stay aligned with shared schemas and avoid exposing repository internals.
  - Real run management, prompt pause/resume, memory-save decisions, and browser automation remain safely deferred.

## 2026-06-28 - Phase 5 resolver order and conservative matching

- Status: Accepted
- Context: Browser automation will later need one deterministic decision layer for whether a scanned field can be filled safely.
- Decision:
  - Keep resolver logic in pure server modules under `apps/server/src/resolvers`.
  - Represent scanned controls as plain `FieldDescriptor` data and return discriminated `ResolverDecision` values: `fill`, `prompt`, or `skip`.
  - Try profile aliases first, then enabled learned answers, then conservative prompt fallbacks.
  - Use exact or strong normalized alias matching for profile fields, with explicit first-name and last-name splitting from `fullName`.
  - Reuse learned answers only when the record is enabled, control types match, label similarity is at least `0.9`, and either host/path match or nearby context similarity is at least `0.8`.
  - Fill option controls only when a saved value exactly matches a visible option or an obvious boolean yes/no option.
  - Prompt for open-ended textareas, ambiguous option sets, unknown labels, missing profile values, and low-confidence matches.
- Consequences:
  - Later page scanning and browser filling phases can call one resolver pipeline without touching persistence, routes, React, or Playwright.
  - Disabled learned answers remain stored but excluded from automatic reuse.
  - The app continues to prefer prompting over guessing and does not generate open-ended application answers.

## 2026-06-28 - Phase 6 browser adapter boundary and scan/fill rules

- Status: Accepted
- Context: The app needs visible browser automation that can scan a page and perform approved fills without moving prompt, memory, or submission policy into Playwright code.
- Decision:
  - Add Playwright as the server browser dependency because the README, implementation plan, and coding standards already selected Playwright for visible local browser automation.
  - Add a browser service that launches Chromium with a persistent user data directory from `browserProfilePath` and uses non-headless mode by default.
  - Keep the `SiteAdapter` boundary under `apps/server/src/adapters`; adapters scan pages into existing resolver `FieldDescriptor` values, fill only resolver `fill` decisions, and classify continuation controls as data.
  - Ship a generic DOM adapter first. It scans visible enabled text inputs, textareas, selects, checkboxes, and radio groups, and ignores file inputs because the current shared control-type contract has no safe file-selection type.
  - Extract labels and context from labels, ARIA attributes, placeholders, fieldset legends, option text, and nearby visible form text.
  - Return sanitized browser step metadata with page URL, field label, control type, decision action, source, reason, counts, or screenshot path only. Do not include answer values.
  - Add screenshot capture as an explicit helper that writes local PNG files under the configured screenshots path and returns file path metadata only.
  - Classify submit/apply/finish-like controls as `final-submit` data and do not click them in Phase 6.
- Consequences:
  - Later run-manager work can compose browser scanning, resolver decisions, prompts, memory updates, and events without giving the browser layer authority to guess answers or submit applications.
  - Browser-facing synthetic form tests can validate scanner and fill behavior without touching real job sites.
  - Manual visible-browser verification requires a local Playwright Chromium install with `npx playwright install chromium`.

## 2026-06-28 - Phase 7 run manager and prompt bridge ownership

- Status: Accepted
- Context: Browser scanning, resolver decisions, prompt persistence, memory persistence, and live run events needed to become one supervised workflow without moving those responsibilities into routes or browser adapters.
- Decision:
  - Add `apps/server/src/runner/run-manager.ts` as the owner of run lifecycle orchestration.
  - Add `apps/server/src/runner/prompt-bridge.ts` as the owner of prompt creation, prompt response persistence, current-prompt clearing, and opt-in learned-answer creation.
  - Keep route handlers thin: `/runs` delegates to the run manager, and prompt responses resume through the run manager instead of writing directly to the repository.
  - Enforce one active in-memory run session for v1.
  - Fill only resolver `fill` decisions automatically; prompt responses are converted into explicit fill decisions and pass through the same adapter fill path.
  - Save learned answers only when the prompt response has `saveForReuse: true`.
  - Mark automatically reused learned answers with `lastUsedAt` after a successful learned-answer fill.
  - Record `failed` and `canceled` states with run steps and events while leaving browser teardown to normal app shutdown.
- Consequences:
  - The runner composes browser, resolver, prompt, memory, and event modules without absorbing their internal responsibilities.
  - Prompt pauses are durable and observable through run status, current prompt, step history, and live events.
  - Memory reuse remains auditable without logging answer values in run steps or events.
  - Multi-page navigation, dashboard UI, and final-submit enforcement remain deferred to later phases.

## 2026-06-28 - Phase 8 stop-before-submit and explicit advance policy

- Status: Accepted
- Context: V1 needs a hard safety boundary around navigation controls so automation can fill safe fields and support human-approved step navigation without clicking final submission controls.
- Decision:
  - Represent continuation controls as `safe-next`, `final-submit`, `review`, or `ambiguous`.
  - Keep classification in the adapter/browser boundary because it can inspect labels, button type, and nearby context before any click.
  - Add `clickContinuationControl` as the adapter-owned click path and hard-block every control that is not `safe-next`.
  - Have the run manager classify controls after filling, persist sanitized review steps, and enter `waitingForReview` with a stop-before-submit event.
  - Keep the reviewed browser session active so a local explicit one-step advance request can reuse the visible page.
  - Expose a minimal `POST /runs/:id/advance` route that delegates to the run manager.
  - Allow explicit advance only from `waitingForReview`, only when exactly one `safe-next` control is available, and only for one step before scanning/filling and stopping for review again.
- Consequences:
  - Final submit, apply, finish, complete, send, done, review, and ambiguous controls are not clicked by normal automation APIs.
  - Dashboard UI can be added later without becoming the sole safety boundary.
  - Review and blocked-advance steps avoid answer values and unnecessary personal data.
  - Manual visible-browser verification remains required outside the Codex sandbox.
