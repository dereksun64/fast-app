# Phase-Specific Prompt

## Role

You are the implementing agent for Phase 4: Server API And Event Stream in this repository.

Your job is to expose a local Fastify API and live run event stream around the Phase 3 repositories without implementing real browser automation, resolver behavior, prompt UI, or a full run manager yet. Keep route handlers thin, validate all API boundaries with shared schemas, publish observable run events through a small in-memory event publisher, and preserve the v1 safety rule that the app never submits an application automatically.

Do not skip repo inspection. Do not assume the repository still matches the original plan. Account for existing files, partial work, local changes, and completed earlier phases before planning or editing.

## Required Reading

Before making a plan or editing code, read and follow:

- `README.md`
- `AGENTS.md`
- `CODING_STANDARDS.md`
- `project/plans/implementation-plan.md`
- `project/trackers/task-tracker.md`
- `project/trackers/test-tracker.md`
- `project/trackers/decision-log.md`
- `project/specs/product-scope.md`
- `project/specs/local-runtime-paths.md`

Before editing, also inspect the current repository state:

- Review the current git status and git diff.
- Review completed Phase 1, Phase 2, and Phase 3 work in docs, trackers, code, and tests.
- Inspect `apps/server/src/`, especially `index.ts`, `config/`, `db/`, `profile/`, `memory/`, and `runner/`.
- Inspect `packages/shared/src/schemas/api-contracts.ts` and `packages/shared/src/schemas/application-run.ts` for request, response, prompt, run, and event schemas.
- Inspect existing server tests and test helpers before adding API integration tests.
- Check package scripts and dependencies before adding or using Fastify.
- Identify any partial Phase 4 work already present.

Do not revert, overwrite, or reformat unrelated user changes.

## Phase Goal

Implement Phase 4: Server API And Event Stream from `project/plans/implementation-plan.md`.

Purpose: expose the local API and live run events without yet driving a real browser workflow.

Target outcome:

- Fastify server bootstrap with explicit plugin registration and startup validation
- Thin validated routes for profile, memory, run creation, run status, prompt responses, and run events
- A stub runner that creates observable pending runs but does not launch a browser or fill forms
- An in-memory event publisher for Server-Sent Events
- API integration tests for valid requests, invalid payloads, missing resources, event delivery, and prompt-response boundaries
- Documentation and trackers updated to match the implemented API behavior

## Current-State Awareness

Before implementation:

1. Inspect the current repository tree and summarize what already exists.
2. Read the Phase 4 section of `project/plans/implementation-plan.md`.
3. Review completed or in-progress earlier phases in trackers, docs, shared contracts, repositories, and tests.
4. Check `git status` and `git diff` before editing.
5. Identify existing file layout, export style, test style, error style, and naming conventions.
6. Preserve established patterns unless there is a clear reason to change them.
7. If the current codebase differs from the plan, explain the difference and choose the safer, more observable path.
8. Keep server, client, shared contracts, database, browser automation, prompt flow, memory reuse, and safety responsibilities separated.
9. Prefer prompting over guessing when confidence is low.
10. Keep privacy-sensitive data out of logs, screenshots, commits, fixtures, test output, and unnecessary API responses.

Phase 4 should build on Phase 2 shared API/event schemas and Phase 3 repositories rather than redefining profile, memory, run, prompt, or event types inside routes.

## Work Mode Choice

Before any code changes, present this choice exactly:

1. `One-shot the whole phase`: implement the full phase in one pass, including tests, docs, verification, and a concise final explanation.
2. `Continue step by step`: implement one small reviewable step at a time, explain that step, then wait for confirmation or further instruction before continuing.

Pause for the user's answer unless the user already selected a mode in the same request.

Default mode if the user does not choose: `Continue step by step`.

Reason for the default: Phase 4 introduces public API boundaries, live event delivery, prompt-response handling, and run lifecycle behavior. These choices affect later browser automation, prompt flow, client UI, and safety behavior, so step-by-step review is safer and more useful for a learning programmer.

## Implementation Boundaries

In scope for this phase:

- Fastify server bootstrap and explicit route/plugin registration
- Startup validation for runtime paths and database initialization
- Repository wiring for profile, memory, and run APIs
- `GET /profile` and `PUT /profile`
- `GET /memory` and `PATCH /memory/:id`
- `POST /runs` that creates a pending run record and uses only a stub runner
- `GET /runs/:id` that returns current run status, steps, and pending prompt summary
- `POST /runs/:id/prompts/:promptId/respond` that validates prompt responses, verifies run/prompt boundaries, and persists the response
- Server-Sent Events endpoint for run status changes, run steps, prompt notifications, prompt answers, and errors
- Structured API errors that avoid unnecessary personal data
- API integration tests against a temporary database
- Documentation and tracker updates reflecting API behavior and test coverage

Out of scope for this phase:

- Real Playwright browser launch or page scanning
- Resolver pipeline or matching behavior
- Filling fields, clicking buttons, or advancing application pages
- Prompt bridge runtime pause/resume orchestration beyond accepting and persisting prompt responses
- React dashboard or client API implementation
- Learned-answer reuse decisions beyond memory route editing
- CAPTCHA or anti-bot handling
- AI-generated answers for application questions
- Autonomous final submission
- Hidden background automation
- Unrelated refactors

V1 safety exclusions:

- Never implement autonomous final submission.
- Never click final submit/apply/finish controls automatically.
- Never bypass CAPTCHA or anti-bot systems.
- Never run hidden browser automation.
- Never generate open-ended job application answers with AI.
- Never log unnecessary personal information.
- Never add dependencies without explicit justification and alternatives considered.

If Fastify or a small Fastify-adjacent test/helper dependency is not already installed, explain why it is necessary, why the existing stack expects it, and what alternatives were considered before adding it.

## Expected Deliverables

Deliver all of the following unless current repo state makes an item inappropriate, in which case explain why:

- Server app/bootstrap module that can be created for tests without immediately listening on a port
- Server entry point that starts the local API only when run as the server process
- Explicit route registration under `apps/server/src/routes/`
- Profile routes backed by `ProfileRepository`
- Memory routes backed by `MemoryRepository`
- Run routes backed by `RunRepository` and a stub runner/service
- In-memory `step-publisher` or event publisher under `apps/server/src/runner/`
- SSE endpoint that serializes shared `RunEvent` payloads as event-stream messages
- Shared-schema validation for request bodies and response payloads where practical
- Consistent structured error responses for invalid payloads, missing resources, and invalid prompt/run relationships
- API integration tests using temporary database paths and isolated app instances
- Tracker updates for Phase 4 tasks and tests
- Decision-log update for API bootstrap, event-stream, and stub-runner decisions
- README update for local server run instructions and API route summary if actual behavior changes documented expectations

Keep route handlers small. Put reusable API, validation, event publishing, and stub-runner behavior in focused server modules rather than embedding workflow logic directly in route files.

## Suggested Step Sequence

| Checkbox | Status | Step | Learning Check |
|---|---|---|---|
| [ ] | Not Started | Inspect current server, shared schemas, repositories, tests, package scripts, docs, trackers, and git diff; summarize existing patterns before editing. | Explain why API work should start by reading shared schemas and repository boundaries. |
| [ ] | Not Started | Add or confirm the minimal server dependencies needed for Fastify, with explicit justification if anything new is installed. | Explain what a web framework provides and why dependency additions must be justified. |
| [ ] | Not Started | Create a Fastify app factory that wires runtime config, database connection, migrations, repositories, event publisher, and explicit route registration without immediately listening. | Explain app factories and why they make integration tests cleaner. |
| [ ] | Not Started | Update the server entry point to start the local API with startup validation and safe local defaults. | Explain startup validation and why configuration errors should fail early. |
| [ ] | Not Started | Add `/profile` GET and PUT routes backed by the profile repository and shared profile request/response schemas. | Explain request validation and why route handlers should delegate persistence work. |
| [ ] | Not Started | Add `/memory` GET and `/memory/:id` PATCH routes for listing, editing, and disabling learned answers. | Explain partial updates and soft disabling of memory records. |
| [ ] | Not Started | Add a stub run service and `/runs` POST route that creates a pending run, records an initial step or status event if appropriate, and does not launch a browser. | Explain stubs and why Phase 4 should not implement browser workflow early. |
| [ ] | Not Started | Add `/runs/:id` GET route that returns run status, step history, and current prompt summary using shared response contracts. | Explain how status endpoints support an observable local UI later. |
| [ ] | Not Started | Add `/runs/:id/prompts/:promptId/respond` route that validates responses, ensures the prompt belongs to the run, persists the response, updates prompt/run state only within Phase 4 boundaries, and publishes an event. | Explain boundary checks and why prompt responses must not trigger unsafe automation in this phase. |
| [ ] | Not Started | Add an SSE endpoint for run status changes, step additions, prompt creation, prompt answers, and run errors using shared event schemas. | Define Server-Sent Events and explain why they fit one-way local progress updates. |
| [ ] | Not Started | Add API integration tests for valid requests, invalid payloads, missing resources, prompt/run mismatches, and SSE event delivery. | Explain integration tests and how temporary databases protect local sensitive data. |
| [ ] | Not Started | Update trackers, decision log, and README/API docs to reflect implemented route behavior, commands run, and remaining gaps. | Explain why planning docs should stay aligned with code in this project. |

Use statuses only from: `Not Started`, `In Progress`, `Blocked`, `Done`.

## Testing And Verification

Add or update tests for behavior changed in this phase. Prioritize:

- Fastify app creation without binding to a real port
- Database migration and repository wiring during app startup
- `GET /profile` empty and populated responses
- `PUT /profile` valid payload persistence and invalid payload rejection
- `GET /memory` list response
- `PATCH /memory/:id` update, disable, invalid payload, and missing-record behavior
- `POST /runs` valid job URL creation and invalid URL rejection
- `GET /runs/:id` status response, missing run behavior, step history, and current prompt shape
- Prompt response route validation for answer, skip, save-for-reuse rules, missing prompt, and run/prompt mismatch
- SSE connection setup, event serialization, event schema validation, and client cleanup behavior
- Structured error shape without unnecessary personal data
- Confirmation that no browser automation or auto-submit behavior was introduced

Run available verification commands, such as:

- Server API integration tests
- Full repository test command
- Server typecheck
- Full repository typecheck
- Build, if available and reasonable

If a command cannot be run, state exactly why.

Manual verification should include:

- Confirm local runtime paths still align with `project/specs/local-runtime-paths.md`
- Confirm test databases are temporary or ignored
- Confirm SQL details stay inside repository and database modules
- Confirm shared API and event contracts are reused rather than duplicated
- Confirm event payloads do not expose unnecessary personal data
- Confirm the server does not launch a browser, fill forms, click controls, or submit anything

## Documentation And Planning Updates

Update documentation when implementation changes actual behavior or project status.

Check whether these need updates:

- `project/trackers/task-tracker.md`
- `project/trackers/test-tracker.md`
- `project/trackers/decision-log.md`
- `README.md`
- `project/plans/implementation-plan.md`
- `project/specs/local-runtime-paths.md`

Record:

- Which Phase 4 steps are complete
- What API tests were added and run
- Route shapes and local server run instructions
- Event-stream and stub-runner decisions
- Any dependency additions and their justification
- Remaining gaps deferred to resolver, browser, run-manager, safety, or UI phases

Do not create redundant documentation that merely restates code without adding value.

## Learning Output Requirements

After each meaningful step or milestone, include concise learning support.

Each meaningful step summary must include:

- A short `Main Purpose` section at the top, in 1-2 sentences
- What changed, with concrete files or modules named first
- Why the change was made and why it belongs in that part of the codebase
- The most important design decision or tradeoff in that step
- What the reviewer should look at in the code and why those files matter
- What was tested or verified, plus any remaining gap for that step

Also:

- Define important terms briefly when they first appear, such as route handler, app factory, schema validation, repository, Server-Sent Events, and stub runner.
- Include 2-4 short quiz questions at the end of each step or milestone.
- Include answers separately under a collapsible or clearly marked `Quiz Answers` section.
- Explain tradeoffs, especially around safety, privacy, testing, API boundaries, event streams, and server/shared separation.
- Avoid overwhelming detail; prefer concise explanations tied directly to the code changed.

## Final Response Requirements

When you finish, provide a concise final response that includes:

- What changed
- Which files changed and the most important ones to review first
- Which tests or checks you ran
- Any remaining gaps, risks, or follow-up work
- A short security/privacy review
- A stop-before-submit review note because this phase touches run flow and operator-facing events
- The learning quiz questions and a clearly marked `Quiz Answers` section

Also require:

- Explain the most important design choices and why the implementation took its current shape.
- Use file links and line references when explaining important code changes.
- Make explicit note of any test you could not run.
- Keep changes small and reviewable.
- Do not perform unrelated refactors.
- Do not add dependencies unless you explain why the dependency is necessary and what alternatives were considered.
- If asked to do git work, keep commits or change groups small and intentional.
