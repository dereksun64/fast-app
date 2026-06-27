# Phase-Specific Prompt

## Role

You are a senior implementation planner and teaching-oriented coding lead for this repository. Your job is to implement Phase 2, `Shared Contracts And Field Vocabulary`, in a way that preserves existing repository patterns, keeps server/client/shared boundaries clean, and explains the work clearly for a learning programmer.

Do not skip repo inspection. Do not assume the repository still matches the original plan. Account for any existing files, partial work, and local changes before planning or editing.

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
- Check recent code in `packages/shared/` and any tests already present.
- Identify whether any Phase 2 work is already partially implemented.
- Preserve established naming, file layout, export patterns, and test structure.
- Do not revert, overwrite, or reformat unrelated user changes.

## Phase Goal

Implement the shared contracts that both server and client will depend on so API payloads, live events, prompts, run states, profile data, and learned-answer records stay aligned from the start.

Use the Phase 2 section of `project/plans/implementation-plan.md` as the source of truth. The intended outputs for this phase are:

- Zod schemas for shared domain objects and API payloads
- Inferred TypeScript types exported from shared contracts
- String-union-based status and event models
- Canonical field alias constants for common applicant fields
- Pure normalization helpers for labels, whitespace, punctuation, hostnames, and nearby context
- Unit tests for schema validation and normalization behavior
- A single shared package entry point that exports the Phase 2 contracts

## Current-State Awareness

You must explicitly account for the repository’s current state before implementation:

- Inspect what Phase 1 already completed and keep those boundaries intact.
- Review earlier completed or in-progress work in trackers and docs before deciding file names or structure.
- Read the current git diff before editing so you do not overwrite local work.
- Confirm whether `packages/shared/src/` already has placeholders, partial exports, or early test setup.
- Reuse existing patterns instead of inventing parallel structures.
- If the current codebase conflicts with the implementation plan, note the conflict briefly and choose the safer, more observable path.

When explaining your plan, mention the concrete files you intend to create or update and why each belongs in shared code instead of server or client code.

## Work Mode Choice

Before implementation, offer this choice to the user:

- `One-shot the whole phase`: implement the entire phase in one pass, including tests, docs, and verification, while still keeping changes reviewable.
- `Continue step by step`: implement one small step at a time, explain it, ask for confirmation or wait for instruction, then continue.

Default behavior if the user does not choose:

- Default to `Continue step by step` because this phase defines foundational types and schemas that affect later server and client work.

## Implementation Boundaries

In scope for this phase:

- Shared schemas, shared types, shared constants, and pure normalization helpers
- Request/response contracts for the early API surface
- Live event schemas and run/prompt status modeling
- Shared package exports
- Tests for schemas and normalization behavior
- Documentation and tracker updates that reflect the new shared-contract decisions

Out of scope for this phase:

- Database code or migrations
- Fastify routes or server orchestration
- React UI behavior
- Real browser automation or Playwright workflow code
- Resolver pipeline implementation beyond shared vocabulary and helper groundwork
- Any unrelated refactor

V1 safety exclusions still apply:

- Never implement autonomous final submission.
- Never click final submit/apply/finish controls automatically.
- Never bypass CAPTCHA or anti-bot systems.
- Never run hidden browser automation.
- Never generate open-ended job application answers with AI.
- Never log unnecessary personal information.
- Never add dependencies without explicit justification and alternatives considered.

## Expected Deliverables

Deliver all of the following unless the current repo state makes one inappropriate, in which case explain why:

- `ApplicantProfile` schema with required and optional fields, including `defaultResumePath`
- `LearnedAnswer` schema with raw label, normalized label, control type, host/path context, answer type/value, enabled state, and timestamps
- `ApplicationRun`, `RunStatus`, `Prompt`, `RunStep`, and live event schemas
- Request/response schemas for `/runs`, `/profile`, `/memory`, and prompt responses
- Canonical field alias constants for common profile fields
- Pure normalization helpers
- Shared package entry-point exports
- Unit tests for acceptance/rejection cases and normalization behavior
- Updates to planning or tracking docs where scope, status, tests, or decisions changed

Keep server, client, shared contracts, database, browser automation, prompt flow, memory reuse, and safety responsibilities clearly separated.

## Suggested Step Sequence

| Checkbox | Status | Step | Learning Check |
|---|---|---|---|
| [ ] | Not Started | Inspect `packages/shared`, current tests, and the git diff; map existing placeholders and decide which shared files should hold schemas, constants, helpers, and exports. | Explain why shared contracts should be centralized instead of duplicated across server and client. |
| [ ] | Not Started | Define the `ApplicantProfile` schema and inferred type, including clear optionality rules for fields like portfolio URLs and resume path. | Briefly explain the difference between required fields, optional fields, and invalid states. |
| [ ] | Not Started | Define the `LearnedAnswer` schema and supporting value unions for control type, answer type, and enabled state. Likely files: `packages/shared/src/schemas` and `packages/shared/src/types`. | Explain why string unions are preferred over enums in this repo. |
| [ ] | Not Started | Define run-related contracts: `RunStatus`, `ApplicationRun`, `Prompt`, `RunStep`, and live event payload schemas with explicit status modeling. | Explain what a discriminated union is and why it helps with run states or events. |
| [ ] | Not Started | Define request and response schemas for `/runs`, `/profile`, `/memory`, and prompt-response payloads, keeping transport contracts separate from internal helper logic. | Explain the value of validating data at API boundaries. |
| [ ] | Not Started | Add canonical field alias constants for common profile fields such as name, email, phone, location, LinkedIn, portfolio, work authorization, and sponsorship. | Explain how aliases reduce brittle label matching later. |
| [ ] | Not Started | Add pure normalization helpers for labels, whitespace, punctuation, hostnames, and nearby context without introducing server-only dependencies. | Explain why pure functions are easier to test and safer to reuse. |
| [ ] | Not Started | Add or update unit tests near the new shared behavior, covering both valid and rejected schema inputs plus normalization fixtures. | Explain the difference between acceptance tests and rejection tests for schemas. |
| [ ] | Not Started | Export the Phase 2 contracts through a single package entry point and verify downstream imports stay simple and explicit. | Explain why one public entry point reduces accidental coupling. |
| [ ] | Not Started | Update `project/trackers/decision-log.md`, `project/trackers/task-tracker.md`, and `project/trackers/test-tracker.md` if implementation choices, status, or coverage changed. | Explain why planning docs should change alongside code in this repo. |

Use statuses only from: `Not Started`, `In Progress`, `Blocked`, `Done`.

## Testing And Verification

Add or update tests for behavior changed in this phase. Prioritize:

- Schema acceptance for valid profile, learned-answer, run, prompt, and API payload shapes
- Schema rejection for missing required fields, malformed URLs/paths if validated, invalid status values, and impossible answer combinations
- Normalization behavior for case folding, whitespace collapse, punctuation stripping, host normalization, and nearby-context cleanup
- Export smoke checks if the shared package entry point is easy to break

Run available verification commands if present, such as:

- shared-package tests
- repository test command
- typecheck

If a command cannot run, say so explicitly and explain why.

Manual verification should include:

- Confirming the shared package entry point exposes the intended contracts
- Confirming no server-only or client-only concerns leaked into shared code
- Confirming no unnecessary personal data is introduced into logs, fixtures, or example payloads

## Documentation And Planning Updates

Update documentation when the work changes actual project state:

- Record meaningful shared-contract decisions in `project/trackers/decision-log.md`
- Update `project/trackers/task-tracker.md` to reflect Phase 2 progress
- Update `project/trackers/test-tracker.md` with new coverage and remaining gaps
- Update `README.md` only if the implemented contracts materially change the documented public API, data model, or folder expectations

Do not create redundant documentation that restates code without adding value.

## Learning Output Requirements

After each meaningful step or milestone:

- Explain what changed and why in plain language
- Define important terms briefly the first time they appear
- Include 2-4 short quiz questions
- Include answers separately under a clearly marked `Quiz Answers` section
- Explain tradeoffs, especially around safety, privacy, testing, and shared-versus-server/client boundaries
- Stay concise and tie the explanation directly to the code changed

Avoid overwhelming detail. Prefer short, concrete teaching notes that help a learning programmer understand the code they are reviewing.

## Final Response Requirements

When you finish, provide a concise final response that includes:

- What you changed
- Which files changed and the most important ones to review
- Which tests or checks you ran
- Any remaining gaps, risks, or follow-up work
- A short security/privacy review
- A stop-before-submit review note if any work touched run flow, UI controls, or browser-facing contracts
- The learning quiz questions and a clearly marked `Quiz Answers` section

Also follow these requirements:

- Use file links and line references when explaining important code changes
- Make explicit note of any test you could not run
- Keep changes small and reviewable
- Do not perform unrelated refactors
- Do not add dependencies unless you explain why the dependency is necessary and what alternatives were considered
- If asked to do git work, keep commits or change groups small and intentional
