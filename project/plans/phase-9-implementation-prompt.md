# Phase-Specific Prompt

## Role

You are the implementing agent for Phase 9: Operator Dashboard in this repository.

Your job is to build the local React dashboard that lets the operator edit profile data, start a run, watch run progress, answer prompts, explicitly advance one safe step, and manage learned answers. Keep the client thin and observable: the server remains authoritative for browser automation, workflow state, prompt persistence, memory persistence, and stop-before-submit safety.

Do not implement autonomous final submission, CAPTCHA handling, hidden automation, AI-generated open-ended answers, deep site-specific job-board UI, or broad workflow refactors in this phase.

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
- Review completed Phase 1 through Phase 8 work in docs, trackers, code, and tests.
- Inspect `apps/client/package.json`, `apps/client/tsconfig.json`, and `apps/client/src/` to understand the current client baseline.
- Inspect `packages/shared/src/`, especially applicant profile, learned answer, run, prompt, event, and API contract schemas.
- Inspect `apps/server/src/routes/`, especially profile, memory, runs, prompt response, advance, and SSE event routes.
- Inspect `apps/server/src/runner/`, especially run status transitions, prompt bridge behavior, review-state behavior, and explicit one-step advance behavior.
- Inspect existing tests under `tests/` to match test style, fixture style, and privacy expectations.
- Identify any partial Phase 9 work already present.

Do not revert, overwrite, or reformat unrelated user changes.

## Phase Goal

Implement Phase 9: Operator Dashboard from `project/plans/implementation-plan.md`.

Purpose: build the usable local UI for editing profile data, starting runs, watching progress, answering prompts, explicitly advancing safe next steps, and managing learned answers.

Target outcome:

- A Vite React client replaces the Phase 1 placeholder and runs as a local operator dashboard.
- The dashboard can load and save applicant profile data through the existing server API.
- The dashboard can list, edit, and disable learned answers through the existing memory API.
- The dashboard can start a run from a job URL and render current run status, latest steps, pending prompts, errors, and review state.
- The dashboard can subscribe to run events over SSE and update the UI without polling-only behavior.
- The prompt panel lets the operator answer, skip, and opt into reuse without guessing or generating answers.
- The review UI clearly communicates stop-before-submit behavior and exposes explicit one-step advance only through the existing safe server boundary.
- Client tests cover validation, prompt response flow, memory disabling, event updates, and review/advance UI behavior.

## Current-State Awareness

Before implementation:

1. Inspect the current repository tree and summarize what already exists.
2. Read the Phase 9 section of `project/plans/implementation-plan.md`.
3. Review completed or in-progress earlier phases in trackers, docs, shared contracts, repositories, routes, resolvers, browser modules, run manager modules, and tests.
4. Check `git status` and `git diff` before editing.
5. Identify existing file layout, export style, test style, error style, event style, and naming conventions.
6. Preserve established patterns unless there is a clear reason to change them.
7. If the current codebase differs from the plan, explain the difference and choose the safer, more observable path.
8. Keep server, client, shared contracts, database, browser automation, prompt flow, memory reuse, and safety responsibilities separated.
9. Prefer prompting over guessing when confidence is low.
10. Keep privacy-sensitive data out of logs, screenshots, commits, fixtures, browser console output, and unnecessary UI/debug output.

Phase 9 should primarily build on the existing server API and shared schemas. Do not move server-owned workflow logic into React. The client may validate request payloads before sending them, but server routes and shared schemas remain the authoritative boundary.

## Work Mode Choice

Before any code changes, present this choice exactly:

1. `One-shot the whole phase`: implement the full phase in one pass, including tests, docs, verification, and a concise final explanation.
2. `Continue step by step`: implement one small reviewable step at a time, explain that step, then wait for confirmation or further instruction before continuing.

Pause for the user's answer unless the user already selected a mode in the same request.

Default mode if the user does not choose: `Continue step by step`.

Reason for the default: Phase 9 touches prompt flow, profile data, learned-answer persistence, live run events, browser-run controls, and stop-before-submit review behavior. It is learning-heavy and data-sensitive, so step-by-step review is safer and more useful for a learning programmer.

## Implementation Boundaries

In scope for this phase:

- Set up the client as a Vite React app if it is still only a placeholder.
- Add a small client API layer for profile, memory, run creation, run status, prompt responses, explicit safe one-step advance, and SSE run events.
- Use shared schemas to validate client request payloads and parse server responses where practical.
- Build a dashboard view with:
  - job URL input
  - start-run button
  - current run status
  - step log
  - latest error display
  - pending prompt display
  - waiting-for-review display
  - explicit one-step advance control when the server says the run is in review
- Build a prompt panel with:
  - field label and nearby context
  - answer input appropriate to the prompt control type where feasible
  - reuse checkbox for answered prompts
  - skip option
  - clear loading, success, and error states
- Build a profile editor for applicant profile fields in the existing shared schema.
- Build a memory editor for listing, editing, and disabling learned answers.
- Add client tests for form validation, API request shaping, prompt response flow, memory disabling, SSE/event updates, and review/advance UI behavior.
- Update docs, trackers, and decision log when dashboard behavior, tests, or boundaries change.

Out of scope for this phase:

- Autonomous final submission.
- Any UI control that clicks final submit/apply/finish controls directly.
- CAPTCHA or anti-bot handling.
- Hidden browser automation.
- AI-generated open-ended application answers.
- Deep site-specific adapters or custom UI for individual job platforms.
- Resume parsing, profile extraction, or file upload automation.
- Browser automation policy changes beyond using the existing explicit one-step advance API.
- Server rewrites unless a small route/schema adjustment is required for the dashboard to use existing behavior safely.
- Unrelated refactors.

V1 safety exclusions:

- Never implement autonomous final submission.
- Never click final submit/apply/finish controls automatically.
- Never bypass CAPTCHA or anti-bot systems.
- Never run hidden browser automation.
- Never generate open-ended job application answers with AI.
- Never log unnecessary personal information.
- Never add dependencies without explicit justification and alternatives considered.

If a dependency is proposed, explain why the current stack is insufficient, why the dependency is necessary, and what alternatives were considered. React and Vite are expected by the plan, but still inspect `package.json` before changing dependencies.

## Expected Deliverables

Deliver all of the following unless current repo state makes an item inappropriate, in which case explain why:

- Vite React client entry point and app shell under `apps/client/src/`.
- Client API helpers for:
  - profile read/update
  - memory list/update/disable
  - run create/status
  - prompt response
  - explicit safe one-step advance
  - run event subscription over SSE
- Dashboard UI for starting runs, displaying status, rendering step history, showing prompt/review states, and surfacing errors.
- Prompt UI that answers or skips prompts without inventing application answers.
- Profile editor using the shared applicant profile contract.
- Memory editor using the shared learned-answer contract, including disabling entries.
- Review UI that reinforces human-only final submission and uses only the existing safe advance endpoint.
- Accessible loading, success, empty, and error states for operator actions.
- Tests for:
  - profile form validation and save behavior
  - job URL validation and run creation
  - prompt answer, skip, and save-for-reuse request payloads
  - learned-answer edit/disable behavior
  - SSE event handling for run status, step, prompt, prompt answer, and error events
  - review-state display and explicit one-step advance behavior
  - privacy expectations such as not rendering answer values in unnecessary logs or debug panels
- Tracker updates for Phase 9 task and test coverage.
- Decision-log update if the dashboard introduces notable client architecture, state management, event handling, or dependency decisions.
- README updates for local dashboard usage and dev URLs.

Keep UI state separate from server workflow state. The client displays and requests actions; it does not decide which browser actions are safe.

## Suggested Step Sequence

| Checkbox | Status | Step | Learning Check |
|---|---|---|---|
| [ ] | Not Started | Inspect current client placeholder, server routes, shared API schemas, run events, trackers, docs, tests, package scripts, and git diff; summarize existing patterns before editing. | Explain why a dashboard should consume shared contracts instead of duplicating API shapes. |
| [ ] | Not Started | Convert or scaffold `apps/client` into the planned Vite React app while preserving workspace scripts and TypeScript project boundaries. | Define Vite and explain why it is a thin frontend build tool rather than the workflow owner. |
| [ ] | Not Started | Add a small client API module that wraps existing profile, memory, run, prompt response, advance, and SSE endpoints with shared-schema validation where practical. | Explain the difference between client-side validation and server authority. |
| [ ] | Not Started | Build the main dashboard shell with clear sections for run controls, current status, step log, prompt panel, profile editor, and memory editor. | Explain why operator UIs should make workflow state visible instead of hiding it behind spinners. |
| [ ] | Not Started | Implement job URL input and run creation with loading, validation, success, and error states. | Explain why URL validation belongs on both client and server. |
| [ ] | Not Started | Implement run status loading and SSE event handling for status changes, step additions, prompts, prompt answers, and errors. | Define SSE and explain why it fits one-way run updates. |
| [ ] | Not Started | Implement the prompt panel with answer, skip, save-for-reuse, disabled/loading states, and clear errors. | Explain why the UI collects user-confirmed answers instead of generating answers. |
| [ ] | Not Started | Implement waiting-for-review display and explicit safe one-step advance control using only the server advance endpoint. | Explain why final-submit safety must remain enforced by the server/browser layer, not just by hidden UI buttons. |
| [ ] | Not Started | Implement the profile editor using shared profile fields and avoid console logging or exposing unnecessary personal data. | Explain what profile data is sensitive and how the UI should treat it. |
| [ ] | Not Started | Implement the memory editor for listing, editing, and disabling learned answers with clear state and error handling. | Explain why learned answers are user-confirmed memory records, not global facts. |
| [ ] | Not Started | Add focused client tests near the changed behavior for validation, API payloads, prompt response flow, memory disabling, event updates, and review/advance UI. | Explain how UI tests can cover user-visible behavior without testing every implementation detail. |
| [ ] | Not Started | Review privacy and safety behavior across UI, tests, console output, docs, and fixtures. | Explain what counts as unnecessary personal-data exposure in a local dashboard. |
| [ ] | Not Started | Update README, task tracker, test tracker, decision log, and product scope if dashboard behavior, dependencies, or safety boundaries changed. | Explain why operator-facing behavior should be documented outside the code. |
| [ ] | Not Started | Run relevant tests, typecheck, build, and any feasible local UI verification; document what passed and what remains unverified. | Explain the difference between automated component tests and manual dashboard verification. |

Use statuses only from: `Not Started`, `In Progress`, `Blocked`, `Done`.

## Testing And Verification

Add or update tests for behavior changed in this phase. Prioritize:

- Client API helpers:
  - profile load/save request and response handling
  - memory list/edit/disable behavior
  - run creation payload validation
  - run status parsing
  - prompt answer and skip payloads
  - advance request behavior
  - SSE event parsing and cleanup
- Dashboard behavior:
  - job URL input validation
  - run creation loading and error states
  - status and step rendering
  - prompt-created event displays the prompt panel
  - prompt-answered event clears or updates prompt state
  - run-error event displays an operator-visible error
  - waiting-for-review state displays human review guidance
  - advance button is only available for appropriate review state and calls the server advance endpoint
- Prompt panel:
  - answer submission with `saveForReuse: true`
  - answer submission with `saveForReuse: false`
  - skip submission with `saveForReuse: false`
  - invalid or empty answer handling
  - loading and route-error states
- Profile editor:
  - loading existing profile
  - client validation before save
  - save success/error states
  - no unnecessary console logging of profile values
- Memory editor:
  - learned-answer list rendering
  - editing safe metadata or answer values supported by the existing API
  - disabling memory entries
  - disabled-state rendering
  - error handling
- Safety and privacy:
  - no UI path attempts to final-submit a job application
  - no CAPTCHA bypass or hidden automation controls
  - no AI-generated open-ended answer feature
  - no answer values in unnecessary debug output
  - tests use fake data only
- Boundaries:
  - React code does not import server-only modules
  - route handlers remain thin if touched
  - shared contract changes are minimal and tested if needed
  - browser adapter and run manager continue to own automation safety

Run the relevant commands available in the repo, such as:

- `npm test`
- `npm run typecheck`
- `npm run build`
- client-specific test, typecheck, or build scripts if the workspace defines them

If a test cannot be run because of the local sandbox, missing browser binary, blocked socket binding, missing browser APIs in the test environment, or another environment limitation, state the exact command attempted, the reason it could not complete, and the remaining manual verification step.

Manual verification, when feasible outside the sandbox:

- Start the server and client locally.
- Open the dashboard in the visible local browser.
- Load and save a fake profile.
- Start a run against a safe synthetic form.
- Confirm live steps appear in the dashboard.
- Confirm prompt answering and skipping work.
- Confirm learned answers can be disabled.
- Confirm review state is visible and final submission remains human-only.
- Confirm explicit safe one-step advance uses the server endpoint and stops again for review.

## Documentation And Planning Updates

Update docs and planning files when behavior, scope, tests, or decisions change:

- `project/trackers/task-tracker.md`: mark Phase 9 tasks as in progress or done with concise notes.
- `project/trackers/test-tracker.md`: add coverage for dashboard validation, prompt response flow, memory editing, SSE updates, and review/advance UI.
- `project/trackers/decision-log.md`: record any notable client architecture, state management, SSE handling, dependency, or dashboard safety decision.
- `project/specs/product-scope.md`: add a Phase 9 boundary if dashboard behavior changes the operator-facing scope.
- `README.md`: document dashboard usage, local dev URLs, and human-only final submission expectations.
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

- Brief definitions for important terms when they first appear, such as "client API layer", "SSE", "controlled form", "shared contract", and "review state".
- 2-4 short quiz questions at the end of each step or milestone.
- Answers separately under a clearly marked `Quiz Answers` section or a collapsible section.
- Plain-language explanations of safety, privacy, testing, and server/client/shared boundaries.
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
