# Phase-Specific Prompt

## Role

You are the implementing agent for Phase 6: Browser Automation And Page Scanning in this repository.

Your job is to add visible Playwright automation that can launch a persistent browser, navigate to a job application URL, scan the current page into plain field descriptors, fill only fields that the resolver pipeline marks as safe, and record observable step metadata without exposing unnecessary personal information.

Do not implement prompt resume orchestration, dashboard UI, memory creation from new prompt answers, multi-page run management, or final-submit behavior in this phase. Phase 6 should build the browser and page-scanning layer that later run-manager phases will call.

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
- Review completed Phase 1 through Phase 5 work in docs, trackers, code, and tests.
- Inspect `packages/shared/src/`, especially control-type, prompt, run, event, profile, learned-answer, and normalization contracts.
- Inspect `apps/server/src/config/`, especially runtime path configuration for browser profile and screenshot paths.
- Inspect `apps/server/src/resolvers/`, especially `FieldDescriptor`, `ResolverDecision`, resolver pipeline behavior, option safety, and test fixtures.
- Inspect `apps/server/src/runner/`, especially run repository, run events, step publisher, and the Phase 4 stub runner.
- Inspect existing server test helpers and fixture style before adding browser-facing tests.
- Check package scripts and dependencies before using Playwright or adding any new dependency.
- Identify any partial Phase 6 work already present.

Do not revert, overwrite, or reformat unrelated user changes.

## Phase Goal

Implement Phase 6: Browser Automation And Page Scanning from `project/plans/implementation-plan.md`.

Purpose: add visible Playwright automation that scans and fills one page conservatively while keeping browser actions observable.

Target outcome:

- Playwright browser service that launches a persistent, non-headless browser using the configured browser profile path
- `SiteAdapter` interface that separates page scanning, safe filling, continuation classification, and site-specific behavior
- Generic DOM adapter that scans inputs, textareas, selects, checkboxes, and radios into resolver-compatible field descriptors
- Label and context extraction using accessible labels, placeholders, visible text, option text, and nearby form text
- Safe fill actions that use stable Playwright locators and condition-based waits
- Sanitized step metadata and optional screenshot capture for notable steps or failures
- Browser-facing tests against local synthetic form fixtures
- Manual verification guidance for visible browser launch and persistent session reuse

## Current-State Awareness

Before implementation:

1. Inspect the current repository tree and summarize what already exists.
2. Read the Phase 6 section of `project/plans/implementation-plan.md`.
3. Review completed or in-progress earlier phases in trackers, docs, shared contracts, repositories, routes, resolvers, and tests.
4. Check `git status` and `git diff` before editing.
5. Identify existing file layout, export style, test style, error style, event style, and naming conventions.
6. Preserve established patterns unless there is a clear reason to change them.
7. If the current codebase differs from the plan, explain the difference and choose the safer, more observable path.
8. Keep server, client, shared contracts, database, browser automation, prompt flow, memory reuse, and safety responsibilities separated.
9. Prefer prompting or returning a prompt decision over guessing when field confidence is low.
10. Keep privacy-sensitive data out of logs, screenshots, commits, fixtures, test output, and unnecessary API responses.

Phase 6 should build on Phase 2 shared contracts, Phase 3 runtime paths and screenshot metadata, Phase 4 run events, and Phase 5 resolver descriptors and decisions. Do not redefine profile, memory, prompt, run, event, or resolver payloads when existing contracts already cover the behavior.

## Work Mode Choice

Before any code changes, present this choice exactly:

1. `One-shot the whole phase`: implement the full phase in one pass, including tests, docs, verification, and a concise final explanation.
2. `Continue step by step`: implement one small reviewable step at a time, explain that step, then wait for confirmation or further instruction before continuing.

Pause for the user's answer unless the user already selected a mode in the same request.

Default mode if the user does not choose: `Continue step by step`.

Reason for the default: Phase 6 introduces browser automation, page scanning, screenshots, and real form-filling behavior. These areas are data-sensitive and safety-sensitive, and they create the boundary that later run orchestration will trust, so step-by-step review is safer and more useful for a learning programmer.

## Implementation Boundaries

In scope for this phase:

- Playwright browser service under `apps/server/src/browser/` or the current equivalent server browser boundary
- Persistent visible browser context using the configured browser profile directory
- Navigation to a run URL in a visible browser
- `SiteAdapter` interface under `apps/server/src/adapters/` or a clearly justified equivalent location
- Generic DOM adapter for:
  - text inputs
  - email, tel, url, number, and similar input types
  - textareas
  - selects
  - checkboxes
  - radios
  - file inputs as scan-only or prompt/skip-safe descriptors unless existing contracts already support safe file selection
- Page scanner that produces existing resolver-compatible `FieldDescriptor` values
- Label and nearby context extraction from accessible labels, `aria-label`, `aria-labelledby`, placeholders, option text, legends, fieldsets, and nearby visible text
- Safe fill actions for resolver `fill` decisions only
- Clear handling for resolver `prompt` and `skip` decisions without filling the field
- Condition-based waits rather than arbitrary sleeps
- Sanitized step metadata for scan, fill, skip, prompt-needed, screenshot, and failure events
- Optional screenshots on notable steps or failures, stored in the configured screenshot path and represented by file path metadata only
- Tests using synthetic local forms or static fixtures
- Documentation and tracker updates reflecting browser install, profile path, screenshot path, and manual login expectations

Out of scope for this phase:

- React dashboard behavior
- Real prompt bridge pause/resume behavior
- Creating database prompts as part of a live browser run
- Saving newly prompted answers to learned memory
- Marking learned answers as used during real runs unless already required by a safe existing boundary
- Multi-page run orchestration
- Clicking final submit, apply, finish, review, or equivalent controls
- One-step advance through next/continue buttons unless implemented only as scan/classification data with no automatic click
- CAPTCHA or anti-bot handling
- Hidden browser automation
- AI-generated answers for job application questions
- Site-specific deep adapters for individual job platforms
- Resume parsing or profile extraction
- Unrelated refactors

V1 safety exclusions:

- Never implement autonomous final submission.
- Never click final submit/apply/finish controls automatically.
- Never bypass CAPTCHA or anti-bot systems.
- Never run hidden browser automation.
- Never generate open-ended job application answers with AI.
- Never log unnecessary personal information.
- Never add dependencies without explicit justification and alternatives considered.

If a dependency is proposed, explain why the current stack is insufficient, why the dependency is necessary, and what alternatives were considered. Playwright is already part of the planned stack; still verify whether it is already installed before changing dependencies.

## Expected Deliverables

Deliver all of the following unless current repo state makes an item inappropriate, in which case explain why:

- Browser service for persistent visible Playwright launch and cleanup
- Page navigation helper that validates URL inputs at the boundary and keeps browser errors observable
- `SiteAdapter` interface with scan, fill, continuation/safety classification, and lifecycle responsibilities clearly separated
- Generic DOM adapter that scans common form controls into existing resolver field descriptors
- Label and nearby-context extraction utilities with focused tests
- Safe fill utilities that apply resolver `fill` decisions without filling `prompt` or `skip` decisions
- Screenshot helper or metadata hook that stores files only in configured local screenshot paths
- Synthetic form fixtures for scanner and fill tests
- Browser-facing tests for:
  - visible/persistent browser configuration where feasible
  - scanner coverage for inputs, textareas, selects, checkboxes, and radios
  - label extraction from accessible labels, placeholders, ARIA labels, legends, and nearby text
  - option extraction for selects, radios, and checkboxes
  - safe fill behavior for text, textarea, select, checkbox, and radio fields
  - no fill action for prompt or skip decisions
  - sanitized metadata that does not include unnecessary personal values
- Tracker updates for Phase 6 tasks and browser-related test coverage
- Decision-log update for adapter boundaries, visible browser configuration, screenshot policy, and scan/fill safety rules
- README or planning updates for Playwright installation, browser profile location, screenshot location, and manual login expectations

Keep browser modules separate from resolver modules. The browser layer should scan fields and perform approved actions; the resolver layer should decide whether an action is safe.

## Suggested Step Sequence

| Checkbox | Status | Step | Learning Check |
|---|---|---|---|
| [ ] | Not Started | Inspect current shared contracts, resolver modules, runtime path config, runner events, tests, docs, trackers, and git diff; summarize existing patterns before editing. | Explain why browser code should consume resolver descriptors instead of inventing new matching types. |
| [ ] | Not Started | Verify Playwright dependency and test environment expectations; add or adjust dependency/config only if missing and justified. | Explain the difference between adding a planned dependency and adding an unnecessary dependency. |
| [ ] | Not Started | Add a Playwright browser service that launches a persistent non-headless context using the configured browser profile path and exposes controlled open/close helpers. | Define persistent browser profile and explain why v1 uses visible automation. |
| [ ] | Not Started | Add focused tests or test seams for browser launch options, profile path usage, and cleanup behavior without storing real user data. | Explain how tests can verify browser configuration without relying on a real job site. |
| [ ] | Not Started | Define the `SiteAdapter` interface and generic adapter responsibilities for scan, fill, and safety/continuation classification without implementing final-submit clicks. | Explain why an adapter boundary keeps generic DOM behavior separate from future site-specific behavior. |
| [ ] | Not Started | Implement generic DOM scanning for inputs, textareas, selects, checkboxes, and radios, producing existing resolver-compatible `FieldDescriptor` values. | Explain what a field descriptor is and why it is safer than passing live DOM handles into resolver logic. |
| [ ] | Not Started | Implement label, option, and nearby-context extraction using accessible labels, placeholders, ARIA attributes, legends, fieldsets, and nearby visible text. | Explain accessible names and why they are more stable than brittle CSS selectors. |
| [ ] | Not Started | Add scanner fixture tests for common fields, ambiguous fields, grouped radios, checkboxes, selects, and missing-label fallback behavior. | Explain why synthetic forms are useful before trying real job sites. |
| [ ] | Not Started | Implement safe fill behavior for resolver `fill` decisions using stable Playwright locators and condition-based waits. | Explain why browser actions must wait on page conditions instead of fixed delays. |
| [ ] | Not Started | Add fill tests proving text inputs, textareas, selects, checkboxes, and radios are filled only when the resolver decision allows it. | Explain why prompt and skip decisions must not cause browser changes. |
| [ ] | Not Started | Add sanitized step metadata and optional screenshot capture for notable scan/fill/failure steps, using configured local paths. | Explain what counts as sensitive data in logs and screenshots. |
| [ ] | Not Started | Add safety classification for continue/submit-like controls as data only, with no automatic final submit or apply clicks. | Explain stop-before-submit and why actual click enforcement belongs in a later phase. |
| [ ] | Not Started | Update trackers, decision log, README, and specs if behavior, browser setup, paths, tests, or decisions changed. | Explain why browser profile and screenshot behavior must be documented for local operators. |
| [ ] | Not Started | Run relevant tests, typecheck, and any feasible manual browser verification; document what passed and what remains unverified. | Explain the difference between automated scanner tests and manual visible-browser verification. |

Use statuses only from: `Not Started`, `In Progress`, `Blocked`, `Done`.

## Testing And Verification

Add or update tests for behavior changed in this phase. Prioritize:

- Browser service configuration:
  - uses configured persistent browser profile path
  - runs non-headless by default
  - creates required local directories without leaking outside configured paths
  - closes contexts cleanly when asked
- Scanner behavior:
  - text inputs, email inputs, phone inputs, URL inputs, textareas, selects, checkboxes, and radios
  - accessible label extraction
  - placeholder fallback
  - ARIA label and ARIA labelled-by extraction
  - fieldset and legend context
  - nearby text context normalization
  - option extraction for select/radio/checkbox controls
  - hidden, disabled, or irrelevant controls excluded or marked safely
- Fill behavior:
  - fill text-like fields only for resolver `fill` decisions
  - select only exact/safe option decisions
  - check or uncheck only when the decision is explicit and safe
  - do not mutate the page for resolver `prompt` or `skip` decisions
  - do not click final submit/apply/finish controls
- Metadata and privacy:
  - step metadata avoids unnecessary answer values and personal data
  - screenshots are optional, local-only, and referenced by path metadata rather than embedded blobs
  - test fixtures use fake data only
- Boundaries:
  - browser code does not decide profile or learned-answer matching itself
  - resolver code does not import Playwright
  - route and dashboard behavior are not expanded beyond what is needed for this phase

Run available verification commands, such as:

- Browser/scanner unit or integration tests
- Resolver tests if any descriptor contract changes
- Server tests
- Shared package tests if shared contracts changed
- Full repository test command
- Server typecheck
- Full repository typecheck
- Build, if available and reasonable

If a command cannot be run, state exactly why.

Manual verification should include, when feasible:

- Launch the local browser service and confirm the browser window is visible.
- Confirm the persistent browser profile directory is used.
- Confirm a simple local synthetic form can be scanned.
- Confirm safe resolver fill decisions change the page and prompt/skip decisions do not.
- Confirm no final submit/apply/finish control is clicked.
- Confirm screenshots, if enabled, land only in the configured screenshot directory.

## Documentation And Planning Updates

Update planning and documentation when scope, status, tests, or decisions change:

- `project/trackers/task-tracker.md`: mark Phase 6 steps completed or in progress, and note remaining follow-up for Phase 7 or Phase 8.
- `project/trackers/test-tracker.md`: add browser service, scanner, fill, fixture, and manual-verification coverage.
- `project/trackers/decision-log.md`: record meaningful decisions about visible browser launch, persistent profile use, adapter boundaries, screenshot policy, scan/fill safety, and any dependency or test-environment choices.
- `README.md`: update current status, local setup, Playwright install/run notes, browser profile location, screenshot behavior, and manual login expectations if the implemented behavior changes what users can do.
- `project/specs/local-runtime-paths.md`: update only if runtime paths or path semantics change.
- `project/specs/product-scope.md`: update only if behavior clarifies v1 scope or safety boundaries.

Do not update docs with aspirational behavior that was not implemented.

## Learning Output Requirements

After each meaningful step, provide concise teaching support. Each step summary must include:

- A short `Main Purpose` section at the top, 1-2 sentences
- What changed, with concrete files or modules named first
- Why the change was made and why it belongs in that part of the codebase
- The most important design decision or tradeoff in that step
- What the user should review in the code and why those files matter
- What was tested or verified, plus any remaining gap for that step

Also include:

- Brief definitions for important terms when they first appear, such as persistent context, locator, accessible name, field descriptor, adapter, synthetic fixture, and sanitized metadata
- Plain-language explanations of how browser scanning, resolver decisions, and browser filling stay separated
- Tradeoff notes around safety, privacy, testing, screenshots, and visible automation
- 2-4 short quiz questions at the end of each step or milestone
- Answers separately under a clearly marked `Quiz Answers` section

Avoid overwhelming detail. Tie explanations directly to the code changed.

## Final Response Requirements

In the final response, summarize:

- Changed files and what each group does
- Tests and verification commands run
- Any commands that could not be run and why
- Manual browser verification performed or still needed
- Remaining gaps, especially items deferred to Phase 7 prompt flow or Phase 8 stop-before-submit enforcement
- The most important design choices and why the implementation took its current shape
- The main files the user should review first
- Security and privacy review results, including logs, screenshots, local profile paths, and no unnecessary personal data exposure
- Confirmation that browser automation is visible and that no autonomous final submission, CAPTCHA bypass, hidden automation, or AI-generated application answers were added

Keep the final response short enough for a learning programmer to use. Include quiz answers if a milestone quiz was provided and not already answered.

Use file links and line references when explaining important changes. If git work is requested, keep commits or change groups small and reviewable.
