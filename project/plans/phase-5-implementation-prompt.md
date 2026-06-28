# Phase-Specific Prompt

## Role

You are the implementing agent for Phase 5: Resolver Pipeline And Conservative Matching in this repository.

Your job is to implement deterministic, testable resolver logic that decides whether a scanned form field can be filled safely from the applicant profile or learned-answer memory, or whether the app must prompt the user. Keep the resolver conservative: when confidence is low, ambiguous, or safety-sensitive, return a prompt or skip decision instead of guessing.

Do not implement browser automation, real page scanning, prompt resume orchestration, dashboard UI, or final-submit behavior in this phase. Phase 5 should prepare the decision layer that later browser and runner phases will call.

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
- Review completed Phase 1, Phase 2, Phase 3, and Phase 4 work in docs, trackers, code, and tests.
- Inspect `packages/shared/src/`, especially field aliases, normalization helpers, profile schemas, learned-answer schemas, prompt schemas, run schemas, and package exports.
- Inspect `apps/server/src/`, especially `profile/`, `memory/`, `runner/`, `routes/`, existing test helpers, and any existing `lib/` or resolver-related modules.
- Inspect repository tests and shared schema tests before adding resolver tests.
- Check package scripts and dependencies before adding or using any test or matching dependency.
- Identify any partial Phase 5 work already present.

Do not revert, overwrite, or reformat unrelated user changes.

## Phase Goal

Implement Phase 5: Resolver Pipeline And Conservative Matching from `project/plans/implementation-plan.md`.

Purpose: implement the core decision logic that decides whether a field can be filled safely or must prompt the user.

Target outcome:

- Field descriptor and resolver decision contracts for scanned form fields
- Profile resolver for common applicant fields using shared aliases and normalization
- Split-name handling where existing profile data supports it
- Learned-answer resolver that only reuses answers on strong matches
- Resolver pipeline that tries profile, then learned memory, then conservative prompt/skip decisions
- Safety rules for checkboxes, radios, selects, and open-ended or ambiguous questions
- Unit tests for alias matching, confidence thresholds, disabled memory exclusion, learned-answer context matching, and low-confidence prompt behavior
- Fixture examples for common application fields and ambiguous questions
- Documentation and trackers updated to match the implemented matching rules

## Current-State Awareness

Before implementation:

1. Inspect the current repository tree and summarize what already exists.
2. Read the Phase 5 section of `project/plans/implementation-plan.md`.
3. Review completed or in-progress earlier phases in trackers, docs, shared contracts, repositories, routes, and tests.
4. Check `git status` and `git diff` before editing.
5. Identify existing file layout, export style, test style, error style, and naming conventions.
6. Preserve established patterns unless there is a clear reason to change them.
7. If the current codebase differs from the plan, explain the difference and choose the safer, more observable path.
8. Keep server, client, shared contracts, database, browser automation, prompt flow, memory reuse, and safety responsibilities separated.
9. Prefer prompting over guessing when confidence is low.
10. Keep privacy-sensitive data out of logs, screenshots, commits, fixtures, test output, and unnecessary API responses.

Phase 5 should build on Phase 2 shared aliases and normalization helpers, Phase 3 learned-answer persistence shapes, and Phase 4 API/run boundaries. Do not redefine profile, memory, prompt, run, or event payloads when shared contracts already exist.

## Work Mode Choice

Before any code changes, present this choice exactly:

1. `One-shot the whole phase`: implement the full phase in one pass, including tests, docs, verification, and a concise final explanation.
2. `Continue step by step`: implement one small reviewable step at a time, explain that step, then wait for confirmation or further instruction before continuing.

Pause for the user's answer unless the user already selected a mode in the same request.

Default mode if the user does not choose: `Continue step by step`.

Reason for the default: Phase 5 introduces matching thresholds, learned-answer reuse rules, prompt-vs-fill decisions, and safety behavior that later browser automation will trust. These choices affect privacy, user control, and application correctness, so step-by-step review is safer and more useful for a learning programmer.

## Implementation Boundaries

In scope for this phase:

- `FieldDescriptor`, `ResolverDecision`, `FieldResolver`, and supporting resolver-domain types
- Profile-field resolution using shared aliases and normalization
- Split-name handling for supported first-name, last-name, and full-name fields
- Learned-answer resolution using enabled learned answers only
- Strong learned-answer matching based on normalized label, control type, host, path, and nearby context
- Resolver pipeline ordering:
  - profile aliases first
  - strong learned-answer match second
  - prompt or skip decision last
- Conservative confidence thresholds that are easy to test and explain
- Safety rules for:
  - checkboxes
  - radios
  - selects
  - open-ended textareas
  - unknown or ambiguous fields
- Unit tests and fixtures for common and ambiguous field scenarios
- Documentation and tracker updates reflecting matching rules and known limitations

Out of scope for this phase:

- Playwright launch, browser sessions, or visible browser automation
- DOM scanning or real locator extraction
- Filling fields in a browser
- Clicking next, continue, apply, submit, finish, or review controls
- Prompt bridge pause/resume runtime behavior
- Creating prompts in the database as part of a real run
- Saving newly prompted answers to memory
- Marking memory as used in live runs
- React dashboard behavior
- Site-specific adapters beyond generic field descriptor assumptions
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

If a dependency is proposed for matching, explain why simple deterministic TypeScript logic is insufficient, why the dependency is necessary, and what alternatives were considered. Prefer no new dependencies for this phase unless there is a strong reason.

## Expected Deliverables

Deliver all of the following unless current repo state makes an item inappropriate, in which case explain why:

- Resolver domain types under `apps/server/src/resolvers/` or a clearly justified shared/server boundary
- Profile resolver module using shared aliases and normalization helpers
- Learned-answer resolver module using shared learned-answer types and conservative context matching
- Resolver pipeline module that returns the first confident fill decision and otherwise returns prompt/skip decisions
- Safety helper logic for ambiguous control types and option matching
- Fixture examples for common application fields and ambiguous fields
- Unit tests for:
  - profile alias resolution
  - split-name handling
  - missing profile values
  - learned-answer strong matches
  - disabled memory exclusion
  - host/path/context mismatch behavior
  - checkbox/radio/select ambiguity
  - open-ended question prompt behavior
  - resolver pipeline ordering
- Tracker updates for Phase 5 tasks and tests
- Decision-log update for resolver order, confidence thresholds, and learned-answer reuse rules
- README or planning updates if actual behavior or documented architecture changes

Keep resolver modules pure where practical. They should accept profile data, learned answers, and field descriptors as inputs and return decisions without touching the database, browser, routes, or UI directly.

## Suggested Step Sequence

| Checkbox | Status | Step | Learning Check |
|---|---|---|---|
| [ ] | Not Started | Inspect current shared contracts, normalization helpers, field aliases, server modules, tests, docs, trackers, and git diff; summarize existing patterns before editing. | Explain why resolver work should start by reading shared aliases, learned-answer schemas, and current repository boundaries. |
| [ ] | Not Started | Define `FieldDescriptor`, `ResolverDecision`, `FieldResolver`, confidence, control-option, and prompt-reason types in the most appropriate server or shared location. | Define a descriptor and explain why browser-scanned fields should be represented as plain data before matching. |
| [ ] | Not Started | Add fixture examples for common application fields and ambiguous fields before or alongside tests. | Explain why fixtures make conservative matching behavior easier to review. |
| [ ] | Not Started | Implement profile resolver logic for shared aliases, normalized labels, placeholders, nearby context, and supported full-name/split-name cases. | Explain alias matching and why profile matching must stay deterministic. |
| [ ] | Not Started | Add profile resolver tests for common fields, missing profile values, split names, weak matches, and prompt fallback behavior. | Explain confidence thresholds and why weak matches should not fill fields automatically. |
| [ ] | Not Started | Implement learned-answer resolver logic that requires enabled memory records, matching control type, strong normalized label similarity, and same host or strong nearby context. | Explain learned-answer reuse and why saved answers are user-confirmed data but not globally true facts. |
| [ ] | Not Started | Add learned-answer resolver tests for strong matches, disabled memory exclusion, host mismatch, path/context behavior, and answer-type compatibility. | Explain why disabled records should remain stored but excluded from automatic reuse. |
| [ ] | Not Started | Implement resolver pipeline ordering: profile resolver first, learned-answer resolver second, conservative prompt or skip decision last. | Explain pipeline ordering and why profile data should usually outrank learned memory. |
| [ ] | Not Started | Add safety rules for checkboxes, radios, selects, open-ended textareas, unknown controls, and ambiguous option sets so uncertain cases prompt instead of guessing. | Explain why option controls are riskier than plain text fields. |
| [ ] | Not Started | Add resolver pipeline tests for first-confident-decision behavior, prompt reasons, skip decisions, and no AI-generated open-ended answers. | Explain how unit tests protect later browser automation from unsafe fill decisions. |
| [ ] | Not Started | Update trackers, decision log, and docs to reflect implemented resolver rules, commands run, and remaining gaps. | Explain why matching thresholds and prompt-over-guess rules should be documented. |

Use statuses only from: `Not Started`, `In Progress`, `Blocked`, `Done`.

## Testing And Verification

Add or update tests for behavior changed in this phase. Prioritize:

- `FieldDescriptor` and `ResolverDecision` shape validation if schemas are introduced
- Profile alias matching for name, email, phone, location, LinkedIn, portfolio, work authorization, and sponsorship fields
- Full-name and split-name behavior
- Missing profile value behavior
- Low-confidence label behavior
- Learned-answer strong label/control-type matching
- Learned-answer same-host behavior
- Learned-answer nearby-context matching
- Learned-answer disabled-state exclusion
- Answer type compatibility for text, boolean, single-choice, multi-choice, and file-like fields if represented
- Checkbox, radio, and select ambiguity prompting
- Open-ended textarea prompting without AI-generated content
- Resolver pipeline ordering and first-confident-decision behavior
- Prompt decisions carrying enough context for later UI without exposing unnecessary personal data
- Confirmation that no browser automation, database writes, route behavior, prompt resume behavior, or auto-submit behavior was introduced

Run available verification commands, such as:

- Resolver unit tests
- Shared package tests if shared contracts changed
- Server tests
- Full repository test command
- Server typecheck
- Full repository typecheck
- Build, if available and reasonable

If a command cannot be run, state exactly why.

Manual verification should include:

- Confirm resolver code is pure and does not touch Playwright, routes, SQLite, or React
- Confirm shared contracts and normalization helpers are reused instead of duplicated
- Confirm learned-answer decisions do not log or expose answer values unnecessarily
- Confirm ambiguous fields produce prompt/skip decisions instead of fill decisions
- Confirm open-ended questions are not answered with AI-generated content
- Confirm no final submit, apply, finish, or navigation-click behavior was introduced

## Documentation And Planning Updates

Update documentation when implementation changes actual behavior or project status.

Check whether these need updates:

- `project/trackers/task-tracker.md`
- `project/trackers/test-tracker.md`
- `project/trackers/decision-log.md`
- `README.md`
- `project/plans/implementation-plan.md`
- `project/specs/product-scope.md`

Record:

- Which Phase 5 steps are complete
- What resolver tests were added and run
- Resolver ordering decisions
- Confidence threshold and match-strength decisions
- Learned-answer reuse constraints
- Prompt-over-guess rules
- Remaining gaps deferred to browser automation, run manager, prompt bridge, stop-before-submit, or UI phases

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

- Define important terms briefly when they first appear, such as field descriptor, resolver, confidence threshold, alias, normalized label, learned answer, nearby context, and conservative fallback.
- Include 2-4 short quiz questions at the end of each step or milestone.
- Include answers separately under a collapsible or clearly marked `Quiz Answers` section.
- Explain tradeoffs, especially around safety, privacy, testing, server/shared boundaries, and prompt-over-guess behavior.
- Avoid overwhelming detail; prefer concise explanations tied directly to the code changed.

## Final Response Requirements

When you finish, provide a concise final response that includes:

- What changed
- Which files changed and the most important ones to review first
- Which tests or checks you ran
- Any remaining gaps, risks, or follow-up work
- A short security/privacy review
- A stop-before-submit review note because this phase creates decisions later browser automation will trust
- The learning quiz questions and a clearly marked `Quiz Answers` section

Also require:

- Explain the most important design choices and why the implementation took its current shape.
- Highlight the main files to review first.
- Note explicitly that no browser automation, hidden automation, AI-generated answers, or auto-submit behavior was added.
- Use file links and line references when explaining important changes.
- If git work is requested, keep commits or change groups small and reviewable.
