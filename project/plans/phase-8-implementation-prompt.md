# Phase-Specific Prompt

## Role

You are the implementing agent for Phase 8: Stop-Before-Submit And Step Navigation Safety in this repository.

Your job is to strengthen the v1 safety boundary around page navigation and final submission. The app may fill safe fields and may support a human-approved one-step advance only when the next action is clearly non-final, but it must never click final submit, apply, finish, send, complete, or equivalent controls automatically.

Do not implement dashboard UI beyond any existing API/server-side hooks needed for explicit user-approved navigation. Do not implement autonomous final submission, CAPTCHA handling, hidden automation, AI-generated answers, or broad multi-page job-site automation in this phase.

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
- Review completed Phase 1 through Phase 7 work in docs, trackers, code, and tests.
- Inspect `packages/shared/src/`, especially run status, run event, run step, prompt, API, and control-type contracts.
- Inspect `apps/server/src/adapters/`, especially `site-adapter.ts`, `generic-dom-adapter.ts`, continuation-control classification, fill behavior, and synthetic form tests.
- Inspect `apps/server/src/browser/`, especially browser service, page scanning, screenshot helpers, and any navigation helper code.
- Inspect `apps/server/src/runner/`, especially `run-manager.ts`, `prompt-bridge.ts`, step publishing, event publishing, review-state handling, cancellation, and prompt response resume behavior.
- Inspect `apps/server/src/routes/`, especially run routes and prompt response routes, before adding or changing any explicit navigation API.
- Inspect existing server test helpers and browser fixture style before adding safety tests.
- Identify any partial Phase 8 work already present.

Do not revert, overwrite, or reformat unrelated user changes.

## Phase Goal

Implement Phase 8: Stop-Before-Submit And Step Navigation Safety from `project/plans/implementation-plan.md`.

Purpose: enforce the most important v1 safety rule. The app may help fill and advance clear non-final steps, but it must never click final submission automatically.

Target outcome:

- Button or action classification that distinguishes clear next/continue actions from final submit/apply/finish actions.
- A hard guard that prevents automation from clicking final-submit-like controls even if a caller requests it.
- A reliable `waitingForReview` state after filling the current page, even if no final submit button is detected.
- Optional one-step advance only for clearly safe next/continue controls, and only after an explicit user action through the local API/UI boundary.
- Prominent stop-before-submit events and persisted steps when the runner reaches human review.
- Tests proving final submit controls are never clicked, ambiguous controls stop or prompt for review, and safe one-step advancement is constrained.

## Current-State Awareness

Before implementation:

1. Inspect the current repository tree and summarize what already exists.
2. Read the Phase 8 section of `project/plans/implementation-plan.md`.
3. Review completed or in-progress earlier phases in trackers, docs, shared contracts, repositories, routes, resolvers, browser modules, run manager modules, and tests.
4. Check `git status` and `git diff` before editing.
5. Identify existing file layout, export style, test style, error style, event style, and naming conventions.
6. Preserve established patterns unless there is a clear reason to change them.
7. If the current codebase differs from the plan, explain the difference and choose the safer, more observable path.
8. Keep server, client, shared contracts, database, browser automation, prompt flow, memory reuse, and safety responsibilities separated.
9. Prefer stopping for review over guessing when button intent or page state is ambiguous.
10. Keep privacy-sensitive data out of logs, screenshots, commits, fixtures, test output, live events, and unnecessary API responses.

Phase 8 should build on Phase 6 browser adapter classification and Phase 7 run manager review-state handling. Do not redefine profile, memory, prompt, run, event, resolver, or browser-adapter payloads when existing contracts already cover the behavior.

## Work Mode Choice

Before any code changes, present this choice exactly:

1. `One-shot the whole phase`: implement the full phase in one pass, including tests, docs, verification, and a concise final explanation.
2. `Continue step by step`: implement one small reviewable step at a time, explain that step, then wait for confirmation or further instruction before continuing.

Pause for the user's answer unless the user already selected a mode in the same request.

Default mode if the user does not choose: `Continue step by step`.

Reason for the default: Phase 8 touches browser automation, run flow, shared safety semantics, and stop-before-submit behavior. It is safety-critical and data-sensitive, so step-by-step review is safer and more useful for a learning programmer.

## Implementation Boundaries

In scope for this phase:

- Button/action classification for clear next/continue controls, final submit/apply/finish controls, review controls, and ambiguous controls.
- A server-side hard guard that refuses to click final-submit-like controls from any run-manager or adapter pathway.
- Runner behavior that enters `waitingForReview` after filling the current page and publishes a clear stop-before-submit event.
- Optional one-step advance only when:
  - the control is classified as clearly non-final,
  - the run is in a state where advancing is allowed,
  - the human explicitly requested the advance through the local control boundary, and
  - the action advances at most one step before returning to scan/fill/review behavior.
- Safe handling for ambiguous controls by stopping for review rather than clicking.
- Sanitized step/event metadata for classification, review stops, blocked final-submit clicks, and safe one-step advances.
- Tests using synthetic forms with submit, apply, finish, complete, review, next, continue, save, and ambiguous buttons.
- Documentation and tracker updates for stop-before-submit behavior and manual review expectations.

Out of scope for this phase:

- React dashboard implementation. If an API route is added for explicit one-step advance, keep it minimal and server-owned so Phase 9 can build UI around it later.
- Autonomous final submission.
- Clicking final submit, apply, finish, complete, send, or equivalent controls automatically.
- CAPTCHA or anti-bot handling.
- Hidden browser automation.
- AI-generated open-ended answers.
- Deep site-specific adapters for individual job platforms.
- Full multi-page automation beyond one explicitly approved, clearly safe advance.
- Resume parsing, file upload behavior, or profile extraction.
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

- Classification logic for continuation controls that clearly separates safe next/continue, final submit, review/confirmation, and ambiguous controls.
- Adapter or browser-layer guard that makes final-submit-like clicks impossible through normal automation APIs.
- Run-manager review-state behavior that stops after current-page filling and records a prominent stop-before-submit step/event.
- Optional explicit user-approved one-step advance flow, if current shared contracts and route boundaries can support it cleanly.
- Sanitized run steps and events for:
  - controls classified on the page,
  - entering review state,
  - blocked final-submit-like action attempts,
  - ambiguous controls requiring review,
  - explicit safe one-step advancement.
- Tests for:
  - final submit controls are classified as blocked/final
  - apply/finish/complete/send controls are classified as blocked/final
  - next/continue controls are classified as safe only when text and context are clearly non-final
  - ambiguous submit/continue controls stop for review
  - the run enters `waitingForReview` after filling the current page
  - no Playwright click occurs on final-submit-like controls
  - one-step advance requires explicit user action and stops again afterward
  - blocked and review events avoid answer values and unnecessary personal data
- Tracker updates for Phase 8 tasks and final-submit safety test coverage.
- Decision-log update for stop-before-submit guard ownership, button classification semantics, and explicit one-step advance policy.
- README or planning updates documenting manual review and the fact that final submission remains human-only.

Keep safety classification separate from profile/memory resolution. The resolver decides field answers; the adapter classifies page controls; the run manager decides workflow state and whether an explicit human action may trigger a safe next step.

## Suggested Step Sequence

| Checkbox | Status | Step | Learning Check |
|---|---|---|---|
| [ ] | Not Started | Inspect current shared contracts, adapter classification, run manager review handling, routes, tests, docs, trackers, and git diff; summarize existing patterns before editing. | Explain why final-submit safety needs to be enforced below the UI, not only hidden in button labels. |
| [ ] | Not Started | Review existing continuation-control types and shared event/run-step contracts; add or adjust contracts only if existing types cannot express Phase 8 safely. | Define contract and explain why shared safety states should be represented explicitly. |
| [ ] | Not Started | Strengthen button classification for clear next/continue, final submit/apply/finish/complete/send, review/confirmation, and ambiguous controls. | Explain why button text, type, form context, and nearby labels all matter for classification. |
| [ ] | Not Started | Add focused synthetic form tests for submit, apply, finish, complete, send, review, next, continue, save, and ambiguous buttons. | Explain why synthetic safety fixtures are more reliable than real job sites for regression tests. |
| [ ] | Not Started | Add a hard browser/adapter guard that refuses to click final-submit-like controls even if a caller attempts it. | Explain defense in depth and why the lowest practical automation layer should block unsafe clicks. |
| [ ] | Not Started | Update run manager behavior so a filled page reliably transitions to `waitingForReview` with a prominent stop-before-submit event. | Explain why `waitingForReview` is different from `completed` in a human-supervised workflow. |
| [ ] | Not Started | Handle ambiguous navigation controls by recording a review-needed step/event instead of clicking. | Explain why ambiguity should stop the run instead of using confidence guesses. |
| [ ] | Not Started | If current API boundaries support it cleanly, add an explicit user-approved one-step advance command that only clicks clearly safe next/continue controls and then returns to scan/fill/review flow. | Explain why explicit user action changes the safety model but still does not permit final submission. |
| [ ] | Not Started | Add integration tests proving final controls are never clicked, ambiguous controls stop, review events are emitted, and safe one-step advance is constrained to explicit requests. | Explain how mocks or fakes can prove a click did not happen. |
| [ ] | Not Started | Review step/event metadata for privacy and remove any answer values, sensitive labels beyond what is necessary, screenshots, or unnecessary personal data. | Explain what counts as sensitive runtime data in this project. |
| [ ] | Not Started | Update trackers, decision log, README, and product scope if stop-before-submit behavior, tests, API boundaries, or operator expectations changed. | Explain why safety behavior must be documented as product behavior, not just test behavior. |
| [ ] | Not Started | Run relevant tests, typecheck, and any feasible manual browser verification; document what passed and what remains unverified. | Explain the difference between automated no-click tests and manual visible-browser verification. |

Use statuses only from: `Not Started`, `In Progress`, `Blocked`, `Done`.

## Testing And Verification

Add or update tests for behavior changed in this phase. Prioritize:

- Button and action classification:
  - clear next and continue controls
  - final submit, apply, finish, complete, send, and done controls
  - review/confirmation controls
  - ambiguous controls where text or context could be either next or final
  - button `type`, form position, visible text, accessible name, and nearby context
- Hard stop-before-submit guard:
  - final-submit-like controls are never clicked by adapter or runner code
  - attempts to click blocked controls return a safe blocked result or error that the runner records
  - guard behavior does not depend only on UI/dashboard code
- Run manager behavior:
  - fills known safe fields, then transitions to `waitingForReview`
  - emits a prominent stop-before-submit event
  - persists review-needed steps in useful order
  - leaves the visible browser open for human review
  - treats ambiguous navigation as review-needed
- Explicit one-step advance, if implemented:
  - requires an explicit local API/user action
  - rejects unsafe run states
  - clicks only clearly safe next/continue controls
  - advances at most one step before returning to scan/fill/review
  - never clicks final-submit-like controls
- Privacy and metadata:
  - events and run steps do not include answer values
  - blocked-click messages avoid unnecessary personal details
  - screenshots remain optional and local-only if used
  - fixtures use fake data only
- Boundaries:
  - resolver code does not classify or click page navigation controls
  - browser adapter does not decide memory reuse or prompt persistence
  - route handlers remain thin and delegate workflow decisions to runner modules

Run the relevant commands available in the repo, such as:

- `npm test`
- `npm run typecheck`
- targeted server, shared, or browser fixture test commands if the workspace defines them

If a test cannot be run because of the local sandbox, missing browser binary, blocked socket binding, or another environment limitation, state the exact command attempted, the reason it could not complete, and the remaining manual verification step.

Manual verification, when feasible outside the sandbox:

- Start the local server with a safe synthetic form.
- Confirm the visible browser fills safe fields and stops before any final submit control.
- Confirm a final submit/apply/finish control remains for the human to click manually.
- Confirm an explicit safe next/continue advance moves only one step and then returns to review or prompt flow.
- Confirm no CAPTCHA, anti-bot, hidden automation, or autonomous final submission behavior was added.

## Documentation And Planning Updates

Update docs and planning files when behavior, scope, tests, or decisions change:

- `project/trackers/task-tracker.md`: mark Phase 8 tasks as in progress or done with concise notes.
- `project/trackers/test-tracker.md`: add coverage for final-submit safety, ambiguous navigation, review-state behavior, and one-step advance if implemented.
- `project/trackers/decision-log.md`: record the stop-before-submit guard ownership, classification policy, and explicit advance policy.
- `project/specs/product-scope.md`: add a Phase 8 boundary if behavior changed or the current scope doc lacks it.
- `README.md`: document operator-facing safety behavior and manual review expectations if the README has a suitable usage/safety section.
- `project/plans/implementation-plan.md`: update only if actual scope or status changed and keep edits minimal.

Do not duplicate long explanations across files. Keep tracking updates concise and aligned with actual behavior.

## Learning Output Requirements

After each meaningful step, provide concise learning support for a learning programmer.

Each step summary must include:

- A short `Main Purpose` section at the top, in 1-2 sentences
- What changed, with concrete files or modules named first
- Why the change was made and why it belongs in that part of the codebase
- The most important design decision or tradeoff in that step
- What the user should review in the code and why those files matter
- What was tested or verified, plus any remaining gap for that step

Also include:

- Brief definitions for important terms when they first appear, such as "hard guard", "classification", "review state", and "one-step advance".
- 2-4 short quiz questions at the end of each step or milestone.
- Answers separately under a clearly marked `Quiz Answers` section or a collapsible section.
- Plain-language explanations of safety, privacy, testing, and server/browser/shared boundaries.
- Concise explanations tied directly to the code changed, without overwhelming detail.

## Final Response Requirements

In the final response, summarize:

- Changed files and the role each main file plays.
- Tests run, with exact commands and whether they passed.
- Tests or manual checks that could not be run, with the reason.
- Remaining gaps or follow-up work.
- The most important design choices and why the implementation took its current shape.
- The main files the reviewer should inspect first.
- A short security/privacy review confirming no final-submit automation, CAPTCHA bypass, hidden automation, AI-generated open-ended answers, unnecessary personal-data logging, or unjustified dependencies were added.
- Quiz answers if they were not already provided after each step.

Keep the final response clear and short enough for a learning programmer to use. Use file links and line references for important changes when practical.

If the user asks for git work, keep commits or change groups small and reviewable. Do not stage, commit, or push unrelated user changes.
