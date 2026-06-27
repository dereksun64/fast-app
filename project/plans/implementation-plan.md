# Implementation Plan

## Planning Assumptions

- The repository currently contains planning docs only, so implementation starts from a clean codebase.
- V1 is single-user, local-only, and optimized for visible human review over speed.
- Use the README defaults unless a phase explicitly narrows them: Node.js 22+, TypeScript, Fastify, React + Vite, Playwright, SQLite, Zod.
- Prefer Server-Sent Events for v1 live updates because the server mostly pushes run status and prompt events.
- All sensitive runtime data stays local and out of version control.

## Phase 1: Project Foundation

Purpose: Establish the minimal monorepo structure, build tooling, local configuration, and documentation trackers before adding runtime behavior.

Necessary context:

- Goal: Create a clean workspace that separates server, client, shared contracts, tests, and local-only data.
- Main files/modules: `package.json`, `tsconfig.json`, `apps/server`, `apps/client`, `packages/shared`, `project`, `.gitignore`.
- Inputs: README stack choices, AGENTS.md constraints, CODING_STANDARDS.md.
- Outputs: Installable workspace skeleton with scripts and ignored sensitive runtime paths.
- Key decisions: Use npm workspaces unless a stronger repo-specific reason appears; keep root docs authoritative instead of duplicating them under `project/instructions`.
- Testing focus: Tooling smoke checks only.
- Documentation updates: Add initial task tracker, test tracker, and decision log.

Steps:

| Checkbox | Status | Step |
|---|---|---|
| [x] | Done | Create root workspace metadata with scripts for installing, building, testing, linting, and running server/client separately. |
| [x] | Done | Add shared TypeScript base config and per-package TypeScript configs. |
| [x] | Done | Create `apps/server`, `apps/client`, and `packages/shared` directories with placeholder entry points only. |
| [x] | Done | Add `.gitignore` entries for `data/`, local databases, browser profile state, logs, screenshots, Playwright traces, and environment files. |
| [x] | Done | Add `project/plans`, `project/trackers`, and `project/specs` with lightweight tracking docs. |
| [x] | Done | Document local runtime paths for database, browser profile, logs, screenshots, and resumes. |
| [x] | Done | Add a basic test runner setup without application behavior tests yet. |
| [x] | Done | Verify install, typecheck, and empty test scripts run successfully. |

## Phase 2: Shared Contracts And Field Vocabulary

Purpose: Define the typed contracts used by both server and client so API payloads, events, run states, prompts, profile data, and memory records stay aligned from the start.

Necessary context:

- Goal: Make invalid states hard to represent and avoid duplicated client/server types.
- Main files/modules: `packages/shared/src/schemas`, `packages/shared/src/types`, `packages/shared/src/constants`.
- Inputs: README data model, public API list, matching rules, CODING_STANDARDS TypeScript/API guidance.
- Outputs: Zod schemas, inferred TypeScript types, status unions, event types, and field alias constants.
- Key decisions: Use string unions over enums; include schema versions on event payloads where useful.
- Testing focus: Schema validation, status transitions, normalization fixtures.
- Documentation updates: Record shared-contract decisions in `project/trackers/decision-log.md`.

Steps:

| Checkbox | Status | Step |
|---|---|---|
| [x] | Done | Define `ApplicantProfile` schema with required and optional fields, including `defaultResumePath`. |
| [x] | Done | Define `LearnedAnswer` schema with raw label, normalized label, control type, host/path context, answer type/value, enabled state, and timestamps. |
| [x] | Done | Define `ApplicationRun`, `RunStatus`, `Prompt`, `RunStep`, and live event schemas. |
| [x] | Done | Define request/response schemas for `/runs`, `/profile`, `/memory`, and prompt responses. |
| [x] | Done | Add canonical field aliases for common profile fields such as name, email, phone, location, LinkedIn, portfolio, work authorization, and sponsorship. |
| [x] | Done | Add pure normalization helpers for labels, whitespace, punctuation, hostnames, and nearby context. |
| [x] | Done | Add unit tests for schema acceptance/rejection and normalization behavior. |
| [x] | Done | Export shared contracts through a single package entry point. |

## Phase 3: SQLite Persistence

Purpose: Add durable local storage for profile data, learned answers, runs, prompts, and step history while treating personal data as sensitive.

Necessary context:

- Goal: Provide repositories that hide SQL details from routes and workflow code.
- Main files/modules: `apps/server/src/db`, `apps/server/src/profile`, `apps/server/src/memory`, `apps/server/src/runner`.
- Inputs: Shared schemas, README data model, privacy rules.
- Outputs: SQLite connection, migrations, repositories, and persistence tests.
- Key decisions: Use explicit migrations; keep screenshots/logs as file paths and metadata, not embedded blobs.
- Testing focus: Migration repeatability, repository CRUD, parameterized queries, no accidental PII in logs.
- Documentation updates: Document database path, migration convention, and sensitive data handling.

Steps:

| Checkbox | Status | Step |
|---|---|---|
| [ ] | Not Started | Add server configuration for database path, browser profile path, logs path, screenshots path, and allowed local resume paths. |
| [ ] | Not Started | Create migration runner that applies ordered migrations once and enables SQLite foreign keys. |
| [ ] | Not Started | Add tables for profile, learned answers, application runs, prompts, run steps, and optional screenshot metadata. |
| [ ] | Not Started | Implement profile repository with get/update behavior validated against shared schemas. |
| [ ] | Not Started | Implement memory repository with list, create, update, disable, and last-used update behavior. |
| [ ] | Not Started | Implement run repository with create, status update, current prompt tracking, step append, and completion/failure timestamps. |
| [ ] | Not Started | Add tests that run migrations against a temporary database. |
| [ ] | Not Started | Add repository tests for profile persistence, memory disabling, prompt persistence, and run lifecycle updates. |

## Phase 4: Server API And Event Stream

Purpose: Expose the local API and live run events without yet driving a real browser workflow.

Necessary context:

- Goal: Build thin validated Fastify routes around repositories and an in-memory event publisher.
- Main files/modules: `apps/server/src/index.ts`, `apps/server/src/routes`, `apps/server/src/runner/step-publisher.ts`.
- Inputs: Shared request/response schemas, persistence repositories.
- Outputs: Running local API with profile, memory, run status, prompt response, and SSE endpoints.
- Key decisions: Use SSE for v1; route handlers validate inputs and delegate to services.
- Testing focus: API validation, structured errors, event payload shape, prompt response boundaries.
- Documentation updates: Add API route summary and local server run instructions.

Steps:

| Checkbox | Status | Step |
|---|---|---|
| [ ] | Not Started | Create Fastify server bootstrap with explicit plugin registration and startup validation. |
| [ ] | Not Started | Add `/profile` GET and PUT routes backed by the profile repository. |
| [ ] | Not Started | Add `/memory` GET and `/memory/:id` PATCH routes for editing or disabling learned answers. |
| [ ] | Not Started | Add `/runs` POST route that creates a pending run record but initially uses a stub runner. |
| [ ] | Not Started | Add `/runs/:id` GET route that returns current run status, steps, and pending prompt summary. |
| [ ] | Not Started | Add `/runs/:id/prompts/:promptId/respond` route that validates prompt responses and persists them. |
| [ ] | Not Started | Add SSE endpoint for run step updates, prompt notifications, status changes, and errors. |
| [ ] | Not Started | Add API integration tests for valid requests, invalid payloads, missing resources, and event delivery. |

## Phase 5: Resolver Pipeline And Conservative Matching

Purpose: Implement the core decision logic that decides whether a field can be filled safely or must prompt the user.

Necessary context:

- Goal: Keep matching deterministic, testable, and conservative.
- Main files/modules: `apps/server/src/resolvers`, `apps/server/src/memory`, `apps/server/src/lib/normalize.ts`, `packages/shared/src/constants/field-aliases.ts`.
- Inputs: Applicant profile, learned answers, scanned field descriptors.
- Outputs: Resolver decisions: fill from profile, fill from learned memory, ask user, or skip unsafe field.
- Key decisions: Resolution order is profile aliases, strong learned-answer match, then prompt; no AI-generated answers.
- Testing focus: Alias matching, confidence thresholds, learned-answer host/context matching, low-confidence prompt behavior.
- Documentation updates: Document matching thresholds and "prompt over guess" rules.

Steps:

| Checkbox | Status | Step |
|---|---|---|
| [ ] | Not Started | Define `FieldDescriptor`, `ResolverDecision`, and `FieldResolver` interfaces in shared or server domain code. |
| [ ] | Not Started | Implement profile resolver for common aliases and split-name handling where profile data supports it. |
| [ ] | Not Started | Implement learned-answer resolver requiring strong label/control-type match plus same host or strong nearby context. |
| [ ] | Not Started | Implement resolver pipeline that stops at the first confident decision and returns prompt decisions otherwise. |
| [ ] | Not Started | Add safety rules for checkboxes, radios, and selects so ambiguous options prompt instead of guessing. |
| [ ] | Not Started | Add unit tests for profile resolution, learned-answer reuse, disabled memory exclusion, and low-confidence prompts. |
| [ ] | Not Started | Add fixture examples for common application fields and ambiguous questions. |

## Phase 6: Browser Automation And Page Scanning

Purpose: Add visible Playwright automation that scans and fills one page conservatively while keeping browser actions observable.

Necessary context:

- Goal: Launch a persistent visible browser, navigate to a URL, scan form controls, fill safe answers, and pause when needed.
- Main files/modules: `apps/server/src/browser/playwright.ts`, `apps/server/src/browser/page-scanner.ts`, `apps/server/src/adapters/generic-dom-adapter.ts`, `apps/server/src/adapters/site-adapter.ts`.
- Inputs: Run URL, persistent browser profile path, resolver decisions.
- Outputs: Field descriptors, browser fill actions, step events, screenshots on notable steps or failures.
- Key decisions: Generic DOM adapter ships first; site adapter interface exists but no deep site-specific adapter yet.
- Testing focus: Scanner fixtures, fill behavior on synthetic forms, visible/persistent browser configuration.
- Documentation updates: Document Playwright install, browser profile location, and manual login expectations.

Steps:

| Checkbox | Status | Step |
|---|---|---|
| [ ] | Not Started | Add Playwright browser service using a persistent user data directory and non-headless browser mode. |
| [ ] | Not Started | Define `SiteAdapter` interface with scan, fill, continue, and safety classification capabilities. |
| [ ] | Not Started | Implement generic DOM adapter for inputs, textareas, selects, checkboxes, and radios. |
| [ ] | Not Started | Extract labels and nearby context using accessible labels, placeholders, visible text, and surrounding form text. |
| [ ] | Not Started | Implement safe field filling using Playwright locators and condition-based waits. |
| [ ] | Not Started | Capture sanitized step metadata and optional screenshots without storing unnecessary personal information. |
| [ ] | Not Started | Add browser-facing tests against local synthetic form fixtures. |
| [ ] | Not Started | Manually verify the browser is visible and the persistent session survives server restart. |

## Phase 7: Run Manager, Prompt Bridge, And Resume Flow

Purpose: Connect scanning, resolution, browser filling, prompts, memory persistence, and live events into a usable supervised workflow.

Necessary context:

- Goal: A run should fill known fields, pause for unknown fields, resume after user input, remember approved answers, and stop for review.
- Main files/modules: `apps/server/src/runner/run-manager.ts`, `apps/server/src/runner/prompt-bridge.ts`, `apps/server/src/runner/step-publisher.ts`.
- Inputs: Run URL, profile, learned answers, field descriptors, user prompt responses.
- Outputs: Observable run states, prompt queue, filled fields, saved learned answers, review state.
- Key decisions: Only one active run for v1 unless explicitly expanded; prompt responses may opt out of memory saving.
- Testing focus: Pause/resume lifecycle, memory creation, event ordering, failure recovery.
- Documentation updates: Document run status meanings and prompt response behavior.

Steps:

| Checkbox | Status | Step |
|---|---|---|
| [ ] | Not Started | Define explicit run lifecycle states: pending, starting, scanning, filling, prompting, waitingForReview, failed, canceled, completed. |
| [ ] | Not Started | Implement run manager that starts one browser-backed run and publishes each step. |
| [ ] | Not Started | Implement prompt bridge that creates a prompt, pauses the run, waits for response, and resumes safely. |
| [ ] | Not Started | Persist user-confirmed prompt answers as learned answers only when the user chooses reuse. |
| [ ] | Not Started | Mark learned answers `lastUsedAt` when automatically reused. |
| [ ] | Not Started | Add cancel/fail handling that leaves the browser visible and records final run state. |
| [ ] | Not Started | Add integration tests for unknown field prompt creation, response resume, memory save, and later reuse. |
| [ ] | Not Started | Add tests proving uncertain fields do not get filled without a prompt response. |

## Phase 8: Stop-Before-Submit And Step Navigation Safety

Purpose: Enforce the most important v1 safety rule: the app may help fill and advance clear steps, but it must never click final submission automatically.

Necessary context:

- Goal: Detect likely submit/final buttons, stop in review state, and require the human to act manually.
- Main files/modules: `apps/server/src/runner`, `apps/server/src/browser/page-scanner.ts`, `apps/server/src/adapters/generic-dom-adapter.ts`, shared run events.
- Inputs: Page buttons, form state, adapter classification, current run step.
- Outputs: `waitingForReview` state with clear event messages and no automatic final submit action.
- Key decisions: When uncertain whether a button is next or submit, stop and ask/review rather than click.
- Testing focus: Final submit never clicked, ambiguous continue buttons prompt/stop, one-step advancement only when clearly safe.
- Documentation updates: Add explicit safety notes and manual review instructions.

Steps:

| Checkbox | Status | Step |
|---|---|---|
| [ ] | Not Started | Add button classification for clear next/continue actions versus final submit/apply/finish actions. |
| [ ] | Not Started | Add hard guard that blocks automation from clicking final submit-like controls. |
| [ ] | Not Started | Add review state after filling the current page even if no final submit button is detected. |
| [ ] | Not Started | Allow optional one-step advance only for clearly safe next buttons and only from an explicit user action in the UI. |
| [ ] | Not Started | Emit a prominent stop-before-submit event when the runner reaches review state. |
| [ ] | Not Started | Add tests using synthetic forms with submit, apply, finish, review, next, and continue buttons. |
| [ ] | Not Started | Add integration test that verifies no Playwright click occurs on final submit controls. |

## Phase 9: Operator Dashboard

Purpose: Build the local UI for editing profile data, starting runs, watching progress, answering prompts, and managing learned answers.

Necessary context:

- Goal: Keep the client thin and observable, with clear loading/error states and accessible controls.
- Main files/modules: `apps/client/src/main.tsx`, `apps/client/src/app.tsx`, `apps/client/src/pages`, `apps/client/src/components`, `apps/client/src/api`.
- Inputs: Server API, SSE events, shared schemas.
- Outputs: Usable local dashboard.
- Key decisions: Client validates request payloads before sending; server remains authoritative for workflow.
- Testing focus: Prompt interactions, event rendering, profile form validation, memory edit behavior.
- Documentation updates: Add dashboard usage instructions and local dev URLs.

Steps:

| Checkbox | Status | Step |
|---|---|---|
| [ ] | Not Started | Create Vite React client with minimal routing for dashboard, profile, and memory views. |
| [ ] | Not Started | Add API client functions using shared schemas for profile, memory, runs, and prompt responses. |
| [ ] | Not Started | Add live events client for run status, step log, prompt creation, and errors. |
| [ ] | Not Started | Build dashboard with job URL input, start button, current run status, step log, and review state display. |
| [ ] | Not Started | Build prompt panel with field context, answer input, reuse checkbox, skip option, and clear error states. |
| [ ] | Not Started | Build profile editor for applicant profile fields without exposing sensitive values in logs. |
| [ ] | Not Started | Build memory editor for listing, editing, and disabling learned answers. |
| [ ] | Not Started | Add client tests for form validation, prompt response flow, memory disabling, and event updates. |

## Phase 10: End-To-End Synthetic Workflow

Purpose: Verify the full v1 loop against controlled forms before trying real job sites.

Necessary context:

- Goal: Prove the server, client, shared contracts, database, browser, prompt flow, memory reuse, and safety guard work together.
- Main files/modules: `tests/fixtures`, `tests/integration`, `apps/server`, `apps/client`.
- Inputs: Synthetic single-page and multi-step application forms.
- Outputs: Repeatable end-to-end coverage and manual QA checklist.
- Key decisions: Keep fixtures simple, representative, and free of real personal data.
- Testing focus: Full workflow from start to review state.
- Documentation updates: Add test instructions and known limitations.

Steps:

| Checkbox | Status | Step |
|---|---|---|
| [ ] | Not Started | Create synthetic fixture pages for common fields, unknown fields, radios/selects, file upload placeholder, multi-step navigation, and final submit. |
| [ ] | Not Started | Add E2E test that fills common fields from profile and stops for review. |
| [ ] | Not Started | Add E2E test that pauses on an unknown field, accepts user response, resumes, and stores memory. |
| [ ] | Not Started | Add E2E test that starts a later similar form and reuses the learned answer only when confidence is high. |
| [ ] | Not Started | Add E2E test that ambiguous radio/select controls ask instead of guessing. |
| [ ] | Not Started | Add E2E test that final submit is not clicked automatically. |
| [ ] | Not Started | Add manual QA checklist for visible browser, persistent login/session behavior, and memory editing. |

## Phase 11: Privacy, Logging, And Runtime Hygiene

Purpose: Tighten handling of sensitive local data before calling v1 usable.

Necessary context:

- Goal: Make logs, screenshots, resumes, profile data, and learned answers local, minimal, and auditable.
- Main files/modules: `apps/server/src/lib/logger.ts`, config module, screenshot capture, README.
- Inputs: Runtime paths, run events, field metadata, screenshot policy.
- Outputs: Structured sanitized logs and documented data retention behavior.
- Key decisions: Default logs should describe states and field labels without full answers unless explicitly needed for debugging.
- Testing focus: Log redaction, ignored local state, path validation.
- Documentation updates: Add privacy and local data cleanup notes.

Steps:

| Checkbox | Status | Step |
|---|---|---|
| [ ] | Not Started | Add structured logger with redaction rules for profile values, answers, resume paths, tokens, and raw page content. |
| [ ] | Not Started | Limit screenshot capture to notable steps and failures, with local-only storage and clear filenames. |
| [ ] | Not Started | Validate resume/file paths before use and avoid copying resume contents into logs or database fields. |
| [ ] | Not Started | Add tests or assertions for logger redaction behavior. |
| [ ] | Not Started | Confirm ignored runtime paths cannot be committed accidentally under normal git status checks. |
| [ ] | Not Started | Document where sensitive data is stored and how to delete it locally. |

## Phase 12: V1 Polish, Docs, And Release Check

Purpose: Align documentation with actual behavior, close test gaps, and produce a minimal usable v1 release candidate.

Necessary context:

- Goal: Make the project understandable for future AI agents and human contributors.
- Main files/modules: `README.md`, `project/trackers`, `project/specs`, package scripts.
- Inputs: Completed behavior, test results, manual QA notes.
- Outputs: Updated README, final tracker statuses, release checklist.
- Key decisions: Document limitations honestly; do not expand scope during polish.
- Testing focus: Full regression run and manual QA.
- Documentation updates: README local setup, usage, safety notes, troubleshooting, known limitations.

Steps:

| Checkbox | Status | Step |
|---|---|---|
| [ ] | Not Started | Update README with actual install, Playwright setup, run commands, dashboard URL, and configuration paths. |
| [ ] | Not Started | Update product scope doc to reflect delivered v1 behavior and explicit non-goals. |
| [ ] | Not Started | Update task tracker, test tracker, and decision log with final status and known gaps. |
| [ ] | Not Started | Run unit, integration, E2E, typecheck, and lint checks. |
| [ ] | Not Started | Complete manual QA against synthetic forms and at least one real application page without submitting. |
| [ ] | Not Started | Verify stop-before-submit behavior remains active in all tested flows. |
| [ ] | Not Started | Record v1 known limitations and future roadmap items without adding them to v1 implementation scope. |

## Folder Structure Recommendation

The README's suggested structure is mostly appropriate. I recommend keeping the `apps/server`, `apps/client`, `packages/shared`, `data`, and `project` shape, with two small adjustments:

```text
fast-app/
├── AGENTS.md
├── CODING_STANDARDS.md
├── README.md
├── package.json
├── tsconfig.base.json
├── apps/
│   ├── server/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   └── client/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
├── packages/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
├── project/
│   ├── plans/
│   ├── specs/
│   └── trackers/
├── tests/
│   ├── fixtures/
│   ├── integration/
│   └── e2e/
└── data/
    ├── .gitkeep
    ├── browser-profile/
    ├── logs/
    └── screenshots/
```

- Keep root `AGENTS.md` and `CODING_STANDARDS.md` as the source of truth instead of copying them into `project/instructions`; this avoids drift for future agents and programmers.
- Use `tsconfig.base.json` plus package-level configs so each app can compile independently while sharing strict TypeScript defaults.
- Keep `tests/fixtures`, `tests/integration`, and `tests/e2e` at the root because several tests cross server, client, shared contracts, and browser behavior.
- Introduce this structure in Phase 1. No migration complexity is expected because no application code exists yet.
- Compatibility concern: future agents should be told in README and trackers that shared schemas are authoritative and client/server types should not be duplicated.

## Cross-Phase Acceptance Criteria

- The app opens a visible, persistent Playwright browser profile.
- A user can create or edit a saved applicant profile locally.
- A run can start from a job application URL through the dashboard.
- Common fields fill from profile aliases when confidence is high.
- Learned answers are reused only on strong matches and can be edited or disabled.
- Unknown or ambiguous fields pause the run and prompt the user in the local UI.
- User-confirmed prompt answers can optionally be saved for reuse.
- The run publishes observable step-by-step status to the dashboard.
- The app stops at review before final submission and never auto-clicks final submit controls.
- CAPTCHAs, logins, and uncertain flows remain manual.
- Logs, screenshots, resumes, profile data, and learned answers are treated as sensitive local data.
- Unit, integration, E2E, and manual QA cover matching, prompt flow, persistence, memory reuse, and stop-before-submit behavior.
- README and project trackers match the delivered behavior.

## Known Risks And Mitigations

- Generic form scanning may miss unusual job-site markup. Mitigation: keep scanner conservative, prompt on uncertainty, and preserve `SiteAdapter` extension point.
- Learned answers could be reused in the wrong context. Mitigation: require strong label/control match plus same host or strong context, and allow disabling/editing memory.
- Final submit detection can be imperfect. Mitigation: hard-block submit-like controls and stop for review when classification is uncertain.
- Sensitive data could leak into logs or screenshots. Mitigation: redact logs, store screenshots locally only, avoid logging full answers/resume contents, and ignore runtime data.
- Browser automation may be flaky. Mitigation: use accessible locators, condition-based waits, synthetic fixtures, and visible browser QA.
- Scope creep into autonomous application behavior. Mitigation: keep final submission, AI-written answers, CAPTCHA bypass, and hidden automation explicitly out of every phase.

## Suggested First PR

Create the project foundation only: workspace package files, TypeScript configs, folder skeleton, `.gitignore` for local runtime data, and initial `project/plans`, `project/trackers`, and `project/specs` docs. Include only tooling smoke checks. No browser automation, API behavior, database schema, or UI behavior in the first PR.
