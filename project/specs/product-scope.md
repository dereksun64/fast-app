# Product Scope

## V1 Summary

This project is a local, human-supervised job application autofiller. The operator uses a visible browser and a local dashboard to review each step.

## In Scope

- Visible browser automation
- Profile-based autofill
- Prompts for uncertain fields
- Learned-answer reuse
- Step-by-step progress with human review
- Stop-before-submit safety

## Out Of Scope

- Autonomous final submission
- CAPTCHA or anti-bot bypass
- Hidden browser automation
- AI-generated open-ended application answers

## Phase 1 Boundary

Phase 1 sets up workspace structure, tooling, placeholder entry points, and local-only data conventions. It does not add API, UI, database, automation, or workflow behavior.

## Phase 5 Boundary

Phase 5 adds pure resolver decisions for scanned field descriptors. It can decide to fill from profile data, fill from enabled learned-answer memory, prompt the user, or skip unsafe fields. It does not scan pages, fill browsers, create live prompts, save new memory records during runs, click navigation controls, or submit applications.

## Phase 6 Boundary

Phase 6 adds the browser and page-scanning layer. It can launch a persistent visible Playwright browser, navigate to validated http/https URLs, scan common controls into existing resolver field descriptors, fill only resolver `fill` decisions, classify continuation controls as data, and capture local screenshot files when requested.

Phase 6 does not create live prompts, resume paused runs, save newly prompted answers, manage multi-page workflows, click next/continue controls, or click final submit/apply/finish controls.

## Phase 7 Boundary

Phase 7 adds the supervised run manager and prompt bridge. It starts one active browser-backed run for v1, scans the current page, resolves fields, fills only safe `fill` decisions, pauses on prompt decisions, resumes after valid prompt responses, saves learned answers only when reuse is explicitly approved, marks automatically reused learned answers with `lastUsedAt`, and stops in `waitingForReview`.

Phase 7 does not add dashboard UI, multi-page navigation, final-submit clicking, CAPTCHA handling, hidden automation, or AI-generated answers.

## Phase 8 Boundary

Phase 8 strengthens stop-before-submit safety. The adapter classifies continuation controls as `safe-next`, `final-submit`, `review`, or `ambiguous`; final, review, and ambiguous controls are blocked from adapter-owned continuation clicks. The run manager records sanitized review steps after page filling and stays in `waitingForReview`.

Phase 8 adds a minimal local API for explicit one-step advance. It only runs from `waitingForReview`, requires exactly one clearly safe next/continue control, advances at most one step, then scans/fills and returns to review. Phase 8 does not add dashboard UI, autonomous final submission, CAPTCHA handling, hidden automation, or AI-generated answers.
