# Phase-Specific Prompt

## Role

You are the implementing agent for Phase 7: Run Manager, Prompt Bridge, And Resume Flow in this repository.

Your job is to connect the existing browser scanner, resolver pipeline, prompt persistence, learned-answer persistence, and live run events into a supervised run workflow. A run should fill known fields, pause for unknown or uncertain fields, resume after a user response, optionally remember approved prompt answers, mark automatically reused learned answers as used, and end in a human-review state instead of submitting anything.

Do not implement dashboard UI, final-submit navigation enforcement beyond preserving the existing stop-before-submit boundary, CAPTCHA handling, hidden automation, AI-generated answers, or autonomous final submission in this phase.

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
- Review completed Phase 1 through Phase 6 work in docs, trackers, code, and tests.
- Inspect `packages/shared/src/`, especially run state, prompt, learned-answer, live-event, API, and control-type contracts.
- Inspect `apps/server/src/runner/`, especially run repository, current stub runner, step publisher, event publisher, and route integration.
- Inspect `apps/server/src/resolvers/`, especially `FieldDescriptor`, resolver decisions, decision sources, learned-answer matching, and prompt fallbacks.
- Inspect `apps/server/src/browser/` and `apps/server/src/adapters/`, especially browser service, generic DOM adapter, scan/fill behavior, continuation classification, screenshot helper, and browser-facing tests.
- Inspect `apps/server/src/memory/` and `apps/server/src/profile/` repository APIs before adding orchestration logic.
- Inspect server route tests and integration test helpers before adding prompt/resume tests.
- Identify any partial Phase 7 work already present.

Do not revert, overwrite, or reformat unrelated user changes.

## Phase Goal

Implement Phase 7: Run Manager, Prompt Bridge, And Resume Flow from `project/plans/implementation-plan.md`.

Purpose: connect scanning, resolution, browser filling, prompts, memory persistence, and live events into a usable supervised workflow.

Target outcome:

- Explicit run lifecycle states for `pending`, `starting`, `scanning`, `filling`, `prompting`, `waitingForReview`, `failed`, `canceled`, and `completed`, using existing shared contracts when available.
- A run manager that starts one browser-backed run for v1, scans the current page, resolves fields, fills safe decisions, pauses for prompt decisions, and publishes observable steps.
- A prompt bridge that creates a prompt, marks the run as prompting, waits for a user response through the existing API boundary, and resumes safely.
- User-confirmed prompt answers saved as learned answers only when the user opts into reuse.
- Automatically reused learned answers marked with `lastUsedAt`.
- Cancel and failure handling that records final state, publishes events, and leaves the visible browser available for human review where appropriate.
- Integration tests for prompt creation, prompt response resume, memory save, later reuse, event ordering, failure handling, and “uncertain fields do not fill without a response.”

## Current-State Awareness

Before implementation:

1. Inspect the current repository tree and summarize what already exists.
2. Read the Phase 7 section of `project/plans/implementation-plan.md`.
3. Review completed or in-progress earlier phases in trackers, docs, shared contracts, repositories, routes, browser modules, resolvers, and tests.
4. Check `git status` and `git diff` before editing.
5. Identify existing file layout, export style, test style, error style, event style, and naming conventions.
6. Preserve established patterns unless there is a clear reason to change them.
7. If the current codebase differs from the plan, explain the difference and choose the safer, more observable path.
8. Keep server, client, shared contracts, database, browser automation, prompt flow, memory reuse, and safety responsibilities separated.
9. Prefer prompting over guessing when field confidence is low.
10. Keep privacy-sensitive data out of logs, screenshots, commits, fixtures, test output, live events, and unnecessary API responses.

Phase 7 should build on Phase 2 shared contracts, Phase 3 repositories, Phase 4 routes/events/stub runner, Phase 5 resolver decisions, and Phase 6 browser adapter behavior. Do not redefine profile, memory, prompt, run, event, resolver, or browser-adapter payloads when existing contracts already cover the behavior.

## Work Mode Choice

Before any code changes, present this choice exactly:

1. `One-shot the whole phase`: implement the full phase in one pass, including tests, docs, verification, and a concise final explanation.
2. `Continue step by step`: implement one small reviewable step at a time, explain that step, then wait for confirmation or further instruction before continuing.

Pause for the user's answer unless the user already selected a mode in the same request.

Default mode if the user does not choose: `Continue step by step`.

Reason for the default: Phase 7 connects browser automation, prompt flow, persistence, learned-answer reuse, and live run state. It is data-sensitive and architecture-shaping, and step-by-step review is safer and more useful for a learning programmer.

## Implementation Boundaries

In scope for this phase:

- Run manager orchestration under `apps/server/src/runner/` or the current equivalent server runner boundary.
- Prompt bridge under `apps/server/src/runner/prompt-bridge.ts` or an equivalent clearly named runner module.
- Explicit lifecycle transitions for start, scan, fill, prompt, resume, waiting for review, failure, cancellation, and completion.
- One active run at a time for v1 unless the existing code already safely supports more.
- Browser-backed run start that uses the existing browser service and site adapter.
- Field resolution using the existing resolver pipeline.
- Safe filling only for resolver `fill` decisions.
- Prompt creation and run pause for resolver `prompt` decisions.
- Resume after a valid prompt response from the existing prompt response API boundary.
- Learned-answer creation only when the prompt response explicitly opts into reuse.
- `lastUsedAt` updates when an enabled learned answer is automatically reused.
- Event and step publishing for lifecycle changes, scanned fields, safe fills, prompts, resumes, memory saves, failures, and cancellation.
- Failure and cancellation handling that records final run state and avoids losing prompt/step history.
- Tests for run orchestration, prompt bridge behavior, memory save/reuse, event ordering, and uncertain-field safety.
- Documentation and tracker updates for run status meanings and prompt response behavior.

Out of scope for this phase:

- React dashboard UI.
- Final-submit button clicking or autonomous application submission.
- Multi-page navigation policy beyond preserving existing continuation classification and review state.
- CAPTCHA or anti-bot handling.
- Hidden browser automation.
- AI-generated answers for open-ended job application questions.
- Site-specific deep adapters for individual job platforms.
- Resume parsing, profile extraction, or file upload handling.
- New browser scanner features unless required to connect existing Phase 6 behavior.
- Unrelated refactors.

V1 safety exclusions:

- Never implement autonomous final submission.
- Never click final submit/apply/finish controls automatically.
- Never bypass CAPTCHA or anti-bot systems.
- Never run hidden browser automation.
- Never generate open-ended job application answers with AI.
- Never log unnecessary personal information.
- Never add dependencies without explicit justification and alternatives considered.

If a dependency is proposed, explain why the current stack is insufficient, why the dependency is necessary, and what alternatives were considered. Prefer the existing stack and existing module boundaries.

## Expected Deliverables

Deliver all of the following unless current repo state makes an item inappropriate, in which case explain why:

- Run lifecycle state handling aligned with shared contracts and repository persistence.
- Run manager that composes profile loading, learned-answer loading, browser navigation/scanning, resolver decisions, safe filling, prompt pauses, resume, and event publishing.
- Prompt bridge that creates one current prompt, persists it, publishes events, waits for a response through the existing API/repository boundary, and resumes the run deterministically.
- Memory persistence path that saves user-confirmed prompt answers only when reuse is explicitly approved.
- Memory usage path that marks automatically reused learned answers as used without exposing answer values in logs or events.
- Cancel/fail handling that records terminal state, publishes events, keeps history inspectable, and avoids closing the visible browser unexpectedly unless an existing cleanup contract requires it.
- Integration tests for:
  - unknown field creates a prompt and pauses the run
  - prompt response resumes the run and fills only the answered field when safe
  - prompt response with reuse enabled creates a learned answer
  - prompt response with reuse disabled does not create a learned answer
  - later run can reuse an approved learned answer and updates `lastUsedAt`
  - uncertain fields do not get filled before a prompt response
  - event ordering across start, scan, fill, prompt, resume, and waiting-for-review states
  - failure and cancellation produce observable final states
- Tracker updates for Phase 7 tasks and tests.
- Decision-log update for run manager ownership, prompt bridge semantics, one-active-run v1 policy, memory-save opt-in behavior, and failure/cancel behavior.
- README or planning updates documenting run status meanings and prompt response behavior.

Keep orchestration modules separate from resolver modules and browser adapter modules. The run manager may compose them; it should not absorb their responsibilities.

## Suggested Step Sequence

| Checkbox | Status | Step | Learning Check |
|---|---|---|---|
| [ ] | Not Started | Inspect current shared contracts, run repository, routes, event publisher, resolver modules, browser service, adapters, tests, docs, trackers, and git diff; summarize existing patterns before editing. | Explain why a run manager should compose browser, resolver, prompt, and memory modules instead of merging their logic. |
| [ ] | Not Started | Verify the existing shared run statuses and repository transitions cover Phase 7; add or adjust contracts only if required by the plan and existing tests. | Define lifecycle state and explain why explicit states are safer than informal flags. |
| [ ] | Not Started | Replace or extend the Phase 4 stub runner with a real run manager that enforces the v1 one-active-run policy and publishes start/scanning/filling state transitions. | Explain why one active run is a conservative v1 choice. |
| [ ] | Not Started | Wire the run manager to load the profile and enabled learned answers, open the visible browser, scan via the existing adapter, and call the resolver pipeline. | Explain the boundary between scanning a field and deciding whether to fill it. |
| [ ] | Not Started | Implement safe fill orchestration for resolver `fill` decisions and publish sanitized step events without answer values. | Explain why event metadata should describe actions without exposing personal data. |
| [ ] | Not Started | Implement prompt bridge creation for resolver `prompt` decisions: persist prompt, set current prompt, publish prompt event, and pause the run. | Define prompt bridge and explain why the run must pause rather than guess. |
| [ ] | Not Started | Connect prompt response handling so a valid response clears the current prompt, resumes the run, and applies the response only through the same safe fill path. | Explain why prompt responses should re-enter the same safety checks as automatic fills. |
| [ ] | Not Started | Persist learned answers from prompt responses only when the user opts into reuse, with host/path/context metadata from the scanned field. | Explain opt-in memory reuse and why user-confirmed answers are not globally true facts. |
| [ ] | Not Started | Mark reused learned answers `lastUsedAt` when a resolver fill decision came from memory. | Explain how usage timestamps make reuse auditable without logging answer content. |
| [ ] | Not Started | Add cancel and failure paths that persist terminal state, publish events, leave enough context for review, and avoid unexpected browser teardown. | Explain the difference between failed, canceled, completed, and waiting-for-review states. |
| [ ] | Not Started | Add integration tests for prompt creation, pause/resume, memory save opt-in/out, later reuse, last-used updates, event ordering, and uncertain-field non-fill behavior. | Explain why orchestration tests should use fakes or fixtures instead of real job sites. |
| [ ] | Not Started | Update trackers, decision log, README, and specs if run statuses, prompt behavior, memory behavior, tests, or operator expectations changed. | Explain why run state meanings need to be documented for a local human operator. |
| [ ] | Not Started | Run relevant tests, typecheck, and any feasible manual run verification; document what passed and what remains unverified. | Explain the difference between repository-level tests, orchestration tests, and manual visible-browser verification. |

Use statuses only from: `Not Started`, `In Progress`, `Blocked`, `Done`.

## Testing And Verification

Add or update tests for behavior changed in this phase. Prioritize:

- Run lifecycle:
  - starts from a persisted pending run
  - transitions through starting, scanning, filling, prompting, and waiting-for-review as appropriate
  - records failed and canceled states with useful sanitized context
  - enforces one active run for v1
- Prompt bridge:
  - creates a prompt for unknown or uncertain fields
  - sets and clears the current prompt correctly
  - pauses the run until a valid response exists
  - rejects or ignores responses for the wrong run or prompt using existing route/repository behavior
  - resumes deterministically after a valid response
- Fill safety:
  - fills only resolver `fill` decisions
  - does not fill resolver `prompt` decisions before a prompt response
  - does not fill resolver `skip` decisions
  - routes prompt responses through safe fill behavior
  - never clicks final submit/apply/finish controls
- Learned-answer persistence:
  - creates a learned answer only when the user chooses reuse
  - does not create memory when reuse is declined
  - records matching metadata needed for later reuse
  - marks reused learned answers `lastUsedAt`
  - keeps disabled memories excluded through existing resolver behavior
- Events and metadata:
  - event ordering is understandable and stable
  - run steps are persisted in useful order
  - no unnecessary personal values are emitted in logs, events, screenshots, or test output
  - failure events contain enough non-sensitive context to debug
- Boundaries:
  - resolver code remains pure and does not import Playwright, repositories, or route modules
  - browser adapter code does not decide memory reuse or prompt persistence
  - route handlers remain thin and delegate orchestration to runner modules

Run the relevant commands available in the repo, such as:

- `npm test`
- `npm run typecheck`
- targeted server or shared test commands if the workspace defines them

If a test cannot be run because of the local sandbox, missing browser binary, blocked socket binding, or another environment limitation, state the exact command attempted, the reason it could not complete, and the remaining manual verification step.

Manual verification, if feasible:

- Start a local run against a synthetic form fixture or safe local page.
- Confirm the visible browser opens.
- Confirm known fields fill, unknown fields pause, prompt response resumes, and the run reaches waiting-for-review without submitting.
- Confirm no final submit/apply/finish control is clicked automatically.

## Documentation And Planning Updates

Update documentation and planning files when behavior, scope, tests, or decisions change. Likely files:

- `project/trackers/task-tracker.md`: mark Phase 7 steps completed or in progress, and note remaining follow-up for Phase 8 final-submit safety or Phase 9 dashboard UI.
- `project/trackers/test-tracker.md`: record prompt resume, memory save/reuse, event ordering, and failure/cancel coverage.
- `project/trackers/decision-log.md`: document run manager ownership, prompt bridge semantics, one-active-run v1 policy, prompt-response memory opt-in, `lastUsedAt` updates, and browser visibility during failure/cancel.
- `README.md`: document run status meanings, prompt response behavior, local visible-browser expectations, and review-state behavior if the README already covers runtime usage.
- `project/specs/product-scope.md` or `project/specs/local-runtime-paths.md`: update only if Phase 7 changes actual scope or runtime-path behavior.

Do not inflate docs with speculative future behavior. Keep README aligned with actual implemented behavior.

## Learning Output Requirements

After each meaningful step or milestone, provide concise teaching notes for the learning programmer.

Each meaningful step summary must include:

- A short `Main Purpose` section at the top
- What changed, with concrete files or modules named first
- Why the change was made and why it belongs in that part of the codebase
- The most important design decision or tradeoff in that step
- What the user should review in the code and why
- What was tested or verified, plus any remaining gap for that step
- Definitions for important terms when they first appear
- 2-4 short quiz questions
- Answers separately under a clearly marked `Quiz Answers` section

Keep explanations tied directly to the code changed. Emphasize safety, privacy, persistence, prompt flow, and boundaries between server/client/shared/browser/resolver code without overwhelming detail.

## Final Response Requirements

In the final response, summarize:

- Changed files and the purpose of each major change group
- Tests run and results
- Any tests or manual checks that could not be run, with the reason
- Remaining gaps or follow-up work, especially Phase 8 final-submit enforcement and Phase 9 dashboard UI
- The most important design choices and why the implementation took its current shape
- The main files the user should review first
- A brief privacy and stop-before-submit safety review
- Quiz questions and answers, or a concise recap of the quiz answers already provided during step-by-step work

Keep the final response clear and short enough for a learning programmer to use. Use file links and line references when explaining important changes. If git work is requested, keep commits or change groups small and reviewable.
