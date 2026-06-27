# Phase-Specific Prompt

## Role

You are the implementing agent for Phase 1: Project Foundation in this repository.

Your job is to establish the minimal monorepo/workspace foundation for the local, human-supervised job application autofiller without adding runtime behavior beyond placeholders and tooling smoke checks. Do not implement later-phase features. Keep the work small, reviewable, and aligned with the current repository state.

## Required Reading

Before planning or editing, read and follow:

- `README.md`
- `AGENTS.md`
- `CODING_STANDARDS.md`
- `project/plans/implementation-plan.md`
- Relevant files in `project/trackers/`, if they exist
- Relevant files in `project/specs/`, if they exist
- `project/plans/phase-prompt-master.md` for prompt intent
- The current git diff and recent codebase state

Before editing, inspect and report:

- Current files already present in the repo
- Current `git status` and any uncommitted user changes
- Whether `project/trackers/` and `project/specs/` already exist
- Whether any workspace/tooling files already exist and should be preserved

Do not overwrite or revert existing user changes.

## Phase Goal

Implement Phase 1: Project Foundation from the implementation plan.

Purpose: establish the minimal monorepo structure, build tooling, local configuration, and documentation trackers before adding runtime behavior.

Target outcome:

- A clean workspace with clear separation between server, client, and shared code
- Installable workspace metadata and TypeScript configuration
- Placeholder app/package entry points only
- Sensitive local runtime paths ignored in version control
- Initial planning/tracking docs in place
- Basic test runner setup for smoke checks
- Successful install/typecheck/test verification for the empty foundation

## Current-State Awareness

Before changing anything:

1. Inspect the repository tree and identify what already exists.
2. Read the Phase 1 section in `project/plans/implementation-plan.md`.
3. Review whether any earlier phase work appears partially started, even if not formally tracked.
4. Check the git diff and preserve existing patterns and user edits.
5. Treat the repo as possibly dirty. Work with existing changes instead of replacing them.
6. If tracker/spec files already exist, extend them carefully instead of recreating them.
7. Keep root docs authoritative unless there is a strong repo-specific reason not to.

Assume the current repo may still be planning-heavy, but verify that assumption from the actual file tree before acting.

## Work Mode Choice

Before implementation, offer the user this choice:

- `One-shot the whole phase`: implement the entire phase in one pass, including tests, docs, and verification, while still keeping changes reviewable.
- `Continue step by step`: implement one small step at a time, explain it, ask for confirmation or wait for instruction, then continue.

Default behavior if the user does not choose:

- Use `Continue step by step` for this phase, because it is foundational and the user is learning.

## Implementation Boundaries

In scope for this phase:

- Root workspace metadata and scripts
- Shared TypeScript base config and package-specific configs
- Minimal directory structure for `apps/server`, `apps/client`, and `packages/shared`
- Placeholder entry points only
- `.gitignore` rules for sensitive local runtime data
- Initial `project/plans`, `project/trackers`, and `project/specs` support files if missing
- Documentation of local runtime paths
- Basic test runner setup
- Tooling verification for install, typecheck, and empty tests

Out of scope for this phase:

- Real API routes
- Real UI behavior
- Database implementation
- Browser automation behavior
- Resolver logic
- Prompt flow
- Memory reuse behavior
- Submission workflows
- Unrelated refactors
- New dependencies without explicit justification

V1 safety rules that still apply:

- Never implement autonomous final submission
- Never click final submit/apply/finish controls automatically
- Never bypass CAPTCHA or anti-bot systems
- Never run hidden browser automation
- Never generate open-ended job application answers with AI
- Never log unnecessary personal information

## Expected Deliverables

Deliverables should include:

- Root `package.json` workspace configuration and scripts
- Root `tsconfig` base plus per-package/app TypeScript configs
- Minimal folder structure for:
  - `apps/server`
  - `apps/client`
  - `packages/shared`
- Placeholder source entry points only, with clear boundaries
- `.gitignore` entries covering:
  - `data/`
  - local databases
  - browser profile state
  - logs
  - screenshots
  - Playwright traces
  - environment files
- Initial tracking/spec files if missing, such as:
  - `project/trackers/task-tracker.md`
  - `project/trackers/test-tracker.md`
  - `project/trackers/decision-log.md`
  - `project/specs/product-scope.md`
- Documentation for local runtime paths for:
  - database
  - browser profile
  - logs
  - screenshots
  - resumes
- Basic test runner setup with no application behavior tests yet
- Verification results for install, typecheck, and empty tests

## Suggested Step Sequence

| Checkbox | Status | Step | Learning Check |
|---|---|---|---|
| [ ] | Not Started | Inspect the current repo state, read the required docs, and summarize what already exists before making changes. | Explain what a workspace/monorepo is and why checking existing state matters before editing. |
| [ ] | Not Started | Create or update root workspace metadata in `package.json` with scripts for install, build, typecheck, test, lint, and separate server/client run flows. | Explain why root scripts improve consistency and reviewability. |
| [ ] | Not Started | Add a shared root TypeScript base config and package/app-specific `tsconfig` files that preserve server, client, and shared separation. | Explain what a base TypeScript config does and why per-package configs still matter. |
| [ ] | Not Started | Create `apps/server`, `apps/client`, and `packages/shared` with placeholder entry points only, following minimal, explicit boundaries. | Explain why placeholder modules are useful before real features exist. |
| [ ] | Not Started | Add or update `.gitignore` to exclude local-only sensitive runtime data and development artifacts. | Explain why privacy-sensitive runtime files should stay out of version control. |
| [ ] | Not Started | Create missing `project/trackers` and `project/specs` files with lightweight initial content aligned to the README and implementation plan. | Explain the purpose of a task tracker, test tracker, decision log, and product scope doc. |
| [ ] | Not Started | Document local runtime paths and storage expectations in the appropriate doc locations without duplicating authoritative guidance unnecessarily. | Explain why predictable local paths help debugging and safe operations. |
| [ ] | Not Started | Add a basic test runner setup for tooling smoke checks only, then verify install, typecheck, and empty tests succeed. | Explain the difference between tooling smoke checks and behavior tests. |

Use only these statuses in progress updates: `Not Started`, `In Progress`, `Blocked`, `Done`.

## Testing And Verification

Add or update only the testing needed for this phase.

Required verification:

- Install succeeds
- Workspace scripts resolve correctly
- TypeScript typecheck succeeds
- Empty or placeholder test command succeeds
- Placeholder entry points do not break tooling

If available in the repo, run the appropriate commands for:

- install
- typecheck
- test

If a command cannot be run, say exactly why.

Manual verification should include:

- Confirm the folder structure matches the intended server/client/shared split
- Confirm `.gitignore` covers sensitive runtime paths
- Confirm no runtime behavior from later phases was introduced
- Confirm docs and trackers reflect the actual current scope

## Documentation And Planning Updates

Update documentation when the work changes the repo’s actual state.

Check whether these need creation or updates:

- `README.md`
- `project/plans/implementation-plan.md`
- `project/trackers/task-tracker.md`
- `project/trackers/test-tracker.md`
- `project/trackers/decision-log.md`
- `project/specs/product-scope.md`

Record at least:

- What foundation files were added
- What verification was run
- Any decisions about workspace/tooling structure
- Any remaining gaps or deferred work

Keep root docs authoritative and avoid duplicating guidance unless the duplication is intentional and useful.

## Learning Output Requirements

Because the user is a learning programmer, after each meaningful step or milestone:

- Explain what changed and why in plain language
- Briefly define important terms the first time they appear
- Include 2-4 short quiz questions
- Provide answers in a clearly marked `Quiz Answers` section
- Explain tradeoffs around:
  - server/client/shared boundaries
  - privacy and ignored files
  - tooling choices
  - keeping the foundation minimal
- Keep explanations concise and tied directly to the files changed

## Final Response Requirements

At the end, provide a concise final response that includes:

- What was changed
- Which files were added or updated
- What tests or verification were run
- Any remaining gaps or follow-up work
- A short security/privacy review
- Quiz questions and answers for the final milestone

Also:

- Use file links and line references for important explanations
- Explicitly note any test that could not be run
- Call out any dependency added and justify it against alternatives
- Avoid unrelated refactors
- If the work touches browser/run/UI code unexpectedly, include a stop-before-submit safety review even though Phase 1 should not reach that scope
