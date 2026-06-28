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
