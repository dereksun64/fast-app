# Phase-Specific Prompt

## Role

You are the implementing agent for Phase 3: SQLite Persistence in this repository.

Your job is to add durable local storage for profile data, learned answers, application runs, prompts, step history, and optional screenshot metadata. Keep SQL and storage details behind server-side repositories, validate persisted data against shared schemas where appropriate, and treat all profile, resume, memory, run, log, and screenshot data as sensitive local data.

Do not implement API routes, browser automation, resolver behavior, prompt UI, or client dashboard features unless they are strictly necessary to test the persistence layer.

## Required Reading

Before planning or editing, read and follow:

- `README.md`
- `AGENTS.md`
- `CODING_STANDARDS.md`
- `project/plans/implementation-plan.md`
- `project/trackers/task-tracker.md`
- `project/trackers/test-tracker.md`
- `project/trackers/decision-log.md`
- `project/specs/product-scope.md`
- `project/specs/local-runtime-paths.md`
- The current git status, git diff, and recent codebase state

Before editing, also inspect:

- `apps/server/src/` for existing server structure and placeholders
- `packages/shared/src/` for Phase 2 schemas, types, constants, and exports
- Existing test setup and naming patterns
- Existing package scripts and dependencies
- Any partial Phase 3 work already present

Do not revert, overwrite, or reformat unrelated user changes.

## Phase Goal

Implement Phase 3: SQLite Persistence from `project/plans/implementation-plan.md`.

Purpose: add durable local storage for profile data, learned answers, runs, prompts, and step history while keeping personal data local and minimizing exposure.

Target outcome:

- Server configuration for local runtime paths
- SQLite connection management with foreign keys enabled
- Ordered, repeatable migrations applied exactly once
- Tables for profile, learned answers, application runs, prompts, run steps, and optional screenshot metadata
- Server-side repositories that hide SQL from future routes and workflow code
- Tests for migrations and repository behavior
- Documentation and trackers updated to match the implemented persistence behavior

## Current-State Awareness

Before implementation:

1. Inspect the current repository tree and summarize what already exists.
2. Read the Phase 3 section of `project/plans/implementation-plan.md`.
3. Review completed Phase 1 and Phase 2 work in trackers, docs, shared contracts, and tests.
4. Check `git status` and `git diff` before editing.
5. Identify existing file layout, export style, test style, and naming conventions.
6. Preserve established patterns unless there is a clear reason to change them.
7. If the current codebase differs from the plan, explain the difference and choose the safer, more observable path.
8. Keep server, client, shared contracts, database, browser automation, prompt flow, memory reuse, and safety responsibilities separated.
9. Prefer prompting over guessing when confidence is low.
10. Keep privacy-sensitive data out of logs, screenshots, commits, test fixtures, and unnecessary output.

Phase 3 should build on Phase 2 shared contracts rather than redefining profile, memory, run, prompt, or event types inside server code.

## Work Mode Choice

Before any code changes, present this choice exactly:

1. `One-shot the whole phase`: implement the full phase in one pass, including tests, docs, verification, and a concise final explanation.
2. `Continue step by step`: implement one small reviewable step at a time, explain that step, then wait for confirmation or further instruction before continuing.

Pause for the user's answer unless the user already selected a mode in the same request.

Default mode if the user does not choose: `Continue step by step`.

Reason for the default: Phase 3 introduces persistence, migrations, local path handling, and sensitive data storage. Those choices affect later API, prompt flow, memory reuse, and browser workflow code, so step-by-step review is safer and more useful for a learning programmer.

## Implementation Boundaries

In scope for this phase:

- Server configuration for:
  - database path
  - browser profile path
  - logs path
  - screenshots path
  - allowed local resume paths
- SQLite connection setup in server code
- Migration runner with ordered migrations and an applied-migrations table
- Foreign key enforcement
- Database tables for:
  - profile data
  - learned answers
  - application runs
  - prompts
  - run steps
  - optional screenshot metadata
- Profile repository with get/update behavior validated against shared schemas
- Memory repository with list, create, update, disable, and last-used update behavior
- Run repository with create, status update, current prompt tracking, prompt persistence, step append, and completion/failure timestamps
- Tests using temporary databases
- Documentation and tracker updates reflecting persistence behavior and test coverage

Out of scope for this phase:

- Fastify API route implementation
- React UI behavior
- Browser automation or Playwright page scanning
- Resolver pipeline or matching behavior
- Prompt bridge runtime behavior
- Learned-answer matching decisions beyond persistence fields
- Screenshot capture behavior beyond optional metadata storage
- Autonomous final submission
- CAPTCHA or anti-bot bypass
- AI-generated answers for open-ended application questions
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

## Expected Deliverables

Deliver all of the following unless current repo state makes an item inappropriate, in which case explain why:

- A server config module for local runtime paths with safe defaults matching `project/specs/local-runtime-paths.md`
- SQLite connection/opening code that enables foreign keys
- Migration runner that applies ordered migrations once and records applied migrations
- Initial migration or migrations for profile, learned answers, application runs, prompts, run steps, and optional screenshot metadata
- Profile repository under `apps/server/src/profile/`
- Memory repository under `apps/server/src/memory/`
- Run repository under `apps/server/src/runner/` or a clearly justified server persistence boundary
- Shared or server-local test helpers for temporary databases, if useful
- Tests for migration repeatability and repository CRUD/lifecycle behavior
- Tracker updates for Phase 3 tasks and tests
- Decision-log update for migration/repository/database-path decisions
- README or local runtime path documentation updates if actual behavior changes documented expectations

Keep screenshots and logs as file paths and metadata only. Do not embed screenshot blobs, resume contents, or unnecessary personal data in the database.

## Suggested Step Sequence

| Checkbox | Status | Step | Learning Check |
|---|---|---|---|
| [ ] | Not Started | Inspect current server, shared contracts, tests, package scripts, docs, trackers, and git diff; summarize existing patterns before editing. | Explain why persistence work should start by reading shared schemas and current diff. |
| [ ] | Not Started | Add server configuration for database path, browser profile path, logs path, screenshots path, and allowed local resume paths with local-safe defaults. | Define configuration and explain why runtime paths should be centralized. |
| [ ] | Not Started | Add SQLite connection code that opens the configured database and enables foreign keys on every connection. | Explain what foreign keys protect and why SQLite needs explicit enforcement. |
| [ ] | Not Started | Create a migration runner that applies ordered migrations once and records completed migrations. | Explain migrations and why repeatability matters. |
| [ ] | Not Started | Add the initial schema for profile, learned answers, application runs, prompts, run steps, and optional screenshot metadata. | Explain primary keys, foreign keys, timestamps, and why screenshots should be metadata or file paths only. |
| [ ] | Not Started | Implement the profile repository with get/update behavior and shared-schema validation at the boundary. | Explain the repository pattern and why SQL should not leak into route or workflow code. |
| [ ] | Not Started | Implement the memory repository with list, create, update, disable, and last-used update behavior. | Explain soft disabling versus deleting learned answers. |
| [ ] | Not Started | Implement the run repository with create, status update, current prompt tracking, prompt persistence, step append, and completion/failure timestamps. | Explain lifecycle state persistence and why run history matters for observability. |
| [ ] | Not Started | Add migration tests against a temporary database, including repeat application and foreign-key behavior. | Explain integration-style persistence tests and how temporary databases keep tests isolated. |
| [ ] | Not Started | Add repository tests for profile persistence, memory disabling, prompt persistence, and run lifecycle updates. | Explain testing externally visible repository behavior instead of private SQL details. |
| [ ] | Not Started | Update trackers, decision log, and docs to reflect the implemented persistence shape, commands run, and remaining gaps. | Explain why planning docs should stay aligned with code in this project. |

Use statuses only from: `Not Started`, `In Progress`, `Blocked`, `Done`.

## Testing And Verification

Add or update tests for behavior changed in this phase. Prioritize:

- Migration repeatability against a temporary database
- Foreign key enforcement
- Profile get/update persistence
- Learned-answer create/list/update/disable behavior
- Learned-answer `lastUsedAt` update behavior
- Prompt persistence and prompt state updates
- Run creation, status transitions, current prompt tracking, step append, completion timestamp, and failure timestamp behavior
- Parameterized-query usage where tests can reasonably catch unsafe assumptions
- Validation failures when persisted or incoming repository data violates shared schemas
- No accidental logging or fixture inclusion of unnecessary personal data

Run available verification commands, such as:

- Server or repository test command
- Full repo test command
- Typecheck
- Build, if available and reasonable

If a command cannot be run, state exactly why.

Manual verification should include:

- Confirm runtime paths align with `project/specs/local-runtime-paths.md`
- Confirm database files created during tests are temporary or ignored
- Confirm SQL details stay inside `apps/server/src/db` and repository modules
- Confirm shared contracts are reused rather than duplicated
- Confirm no browser automation, route behavior, UI behavior, or auto-submit behavior was introduced

## Documentation And Planning Updates

Update documentation when implementation changes actual behavior or project status.

Check whether these need updates:

- `project/trackers/task-tracker.md`
- `project/trackers/test-tracker.md`
- `project/trackers/decision-log.md`
- `project/specs/local-runtime-paths.md`
- `README.md`
- `project/plans/implementation-plan.md`

Record:

- Which Phase 3 steps are complete
- What persistence tests were added and run
- Database path and migration convention decisions
- Sensitive data handling decisions
- Any remaining gaps, blocked items, or deferred work

Do not create redundant documentation that merely restates code. Keep docs useful for future agents and a learning programmer.

## Learning Output Requirements

After each meaningful step or milestone, include:

- A short `Main Purpose` section at the top, in 1-2 sentences
- A concrete overview of files or modules changed before teaching notes
- Why the change was made and why it belongs in that part of the codebase
- The most important design decision or tradeoff for the step
- What the reviewer should inspect in the code and why those files matter
- What was tested or verified, plus any remaining gap for that step
- Brief definitions for important terms when they first appear
- 2-4 short quiz questions
- Answers under a clearly marked `Quiz Answers` section

Explain tradeoffs around:

- Persistence safety
- Privacy and sensitive data
- Migration design
- Repository boundaries
- Shared-schema validation
- Testing with temporary databases
- Keeping v1 conservative and observable

Avoid overwhelming detail. Tie teaching notes directly to the files changed.

## Final Response Requirements

When finished, provide a concise final response that includes:

- What changed
- The most important files to review first
- Tests and verification commands run
- Any commands that could not be run and why
- Remaining gaps, risks, or follow-up work
- A short security/privacy review
- A stop-before-submit review note confirming this phase did not add browser automation or submission controls
- The most important design choices and why the implementation took its current shape
- Final quiz questions and a clearly marked `Quiz Answers` section

Also:

- Use file links and line references for important changes.
- Keep explanations clear enough for a learning programmer.
- Keep changes small and reviewable.
- Use small commits or change groups if the user asks for git work.
- Do not perform unrelated refactors.
- Do not add dependencies unless you explain why the dependency is necessary and what alternatives were considered.
