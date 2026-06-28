# Bare-Bones Observable Job Application Autofiller

## Overview

This project is a local, minimal v1 job application autofiller that opens a real browser, navigates to a job application URL, fills common fields from a saved profile, pauses on uncertain fields, asks the user in a small local web UI, and saves confirmed answers for reuse on later applications.

The design stays intentionally small, but splits responsibilities cleanly so future versions can add richer memory, site adapters, resume parsing, and submission workflows without reworking the foundation.

This is a human-supervised autofill tool, not a fully autonomous job application bot.

## Current Status

The repository currently includes Phase 1 and Phase 2 foundation work, Phase 3 persistence work, and Phase 4 local API work:

- npm workspace setup
- TypeScript project references
- placeholder server and client entry points
- shared schemas, types, constants, and normalization helpers
- local-only runtime path conventions
- server runtime path configuration
- SQLite connection management, migration runner, and initial persistence schema
- server-side repositories for profile data, learned answers, application runs, prompts, step history, and screenshot metadata
- Fastify local API bootstrap with explicit route registration
- validated routes for profile, learned-answer memory, run creation/status, prompt responses, and run events
- in-memory run event publisher and Server-Sent Events endpoint
- stub runner that creates observable pending runs without launching browser automation
- planning and tracking documents

No dashboard behavior, browser automation, or resolver logic has been implemented yet.

## Scope

### In Scope For V1

- Visible browser automation for job application forms
- Filling common fields from a saved applicant profile
- Pausing on uncertain fields and asking the user what to do
- Remembering user-confirmed answers for later reuse
- Advancing through clear next steps one page at a time
- Stopping for human review before final submission

### Out Of Scope For V1

- Autonomous final submission
- AI-generated answers for open-ended questions
- Broad anti-bot or CAPTCHA bypass
- Deep site-specific adapters for every job platform
- Resume parsing and profile extraction
- Fully hands-off multi-step application completion

## Chosen Defaults

- Operator experience: local web app
- Persistence: SQLite
- Initial scope: generic forms first, with room for site-specific adapters later
- Safety model: fill and stop for human review by default; do not auto-submit in v1

## Tech Stack

- Runtime: Node.js 22+
- Language: TypeScript
- Browser automation: Playwright with a persistent browser profile so the session is visible and reusable
- Backend: Fastify for a small local API and orchestration server
- Frontend: React + Vite for a small operator dashboard
- Storage: SQLite with `better-sqlite3`
- Validation: Zod for API payloads and internal task/event schemas
- State transport: Server-Sent Events or WebSocket for live status updates and ambiguity prompts
- Logging: structured JSON logs to local files plus lightweight screenshot capture on notable steps

## What It Does

- Opens a visible browser for job applications
- Fills common fields from a saved applicant profile
- Pauses on uncertain fields and asks the user for input
- Saves confirmed answers for later reuse
- Stops at review instead of submitting automatically

## Out Of Scope For V1

- No autonomous final submission
- No fancy AI answer generation
- No broad anti-bot bypass

## System Shape

The app is split into two local processes:

- `server`: owns Playwright, workflow orchestration, prompt queue, and SQLite access
- `client`: shows current run status, browser step log, pending questions, and learned answers

The code should stay minimal by organizing around a few focused modules:

- `profile` for canonical applicant data
- `memory` for learned field-answer mappings
- `runner` for application sessions
- `field-matcher` for deciding whether to autofill or ask
- `prompt-bridge` for pausing and resuming runs when user input is needed

## Suggested Folder Structure

This structure keeps v1 small while preserving clear boundaries between browser orchestration, the operator UI, and shared contracts.

```text
fast-app/
├── README.md
├── package.json
├── tsconfig.json
├── project/
│   ├── plans/
│   │   ├── implementation-plan.md
│   │   └── phase-prompt-master.md
│   ├── trackers/
│   │   ├── task-tracker.md
│   │   ├── test-tracker.md
│   │   └── decision-log.md
│   └── specs/
│       ├── local-runtime-paths.md
│       └── product-scope.md
├── apps/
│   ├── server/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── routes/
│   │       │   ├── runs.ts
│   │       │   ├── profile.ts
│   │       │   └── memory.ts
│   │       ├── runner/
│   │       │   ├── run-manager.ts
│   │       │   ├── prompt-bridge.ts
│   │       │   └── step-publisher.ts
│   │       ├── browser/
│   │       │   ├── playwright.ts
│   │       │   └── page-scanner.ts
│   │       ├── resolvers/
│   │       │   ├── profile-resolver.ts
│   │       │   ├── learned-answer-resolver.ts
│   │       │   └── resolver-pipeline.ts
│   │       ├── adapters/
│   │       │   ├── site-adapter.ts
│   │       │   └── generic-dom-adapter.ts
│   │       ├── memory/
│   │       │   ├── memory-repository.ts
│   │       │   └── memory-matcher.ts
│   │       ├── profile/
│   │       │   └── profile-repository.ts
│   │       ├── db/
│   │       │   ├── sqlite.ts
│   │       │   └── migrations/
│   │       └── lib/
│   │           ├── logger.ts
│   │           └── normalize.ts
│   └── client/
│       └── src/
│           └── index.ts
├── packages/
│   └── shared/
│       └── src/
│           └── index.ts
├── data/
│   ├── app.db
│   ├── browser-profile/
│   ├── logs/
│   └── screenshots/
└── tests/
    ├── unit/
    ├── integration/
    └── fixtures/
```

### Folder Notes

- `project` is for human and agent working docs: instructions, implementation plans, task tracking, test tracking, and decision records.
- `apps/server` owns browser automation, orchestration, prompt handling, persistence, and APIs.
- `apps/client` is the local operator dashboard for starting runs, answering prompts, and editing saved data.
- `packages/shared` holds schemas, shared types, and constants used by both sides so contracts stay aligned.
- `data` is local-only runtime state and should be ignored in version control.
- `tests` is split by unit and integration coverage, with fixtures for synthetic forms.

### Project Ops Files

- `project/plans/implementation-plan.md` is the current build plan for v1 milestones and sequencing.
- `project/plans/phase-prompt-master.md` is the reusable prompt template for generating phase-specific implementation prompts.
- `project/trackers/task-tracker.md` tracks feature work, status, owners, and blockers.
- `project/trackers/test-tracker.md` tracks planned coverage, execution status, and known gaps.
- `project/trackers/decision-log.md` records important architectural or product decisions so context is not lost.
- `project/specs/product-scope.md` holds a tighter product brief than the README.
- `project/specs/local-runtime-paths.md` documents local-only storage paths for sensitive runtime data.

## Core Workflow

1. The user enters a job application URL in the dashboard and clicks Start.
2. The server launches or reuses a visible Playwright browser context with a persistent user-data directory.
3. The runner navigates the page and scans form controls:
   - text inputs
   - textareas
   - selects
   - checkboxes and radios only for obvious yes/no or saved exact matches
4. For each field, resolution happens in this order:
   - direct canonical profile mapping by known aliases
   - exact or high-confidence learned answer match from memory
   - otherwise pause and ask the user
5. After the user answers a prompt, the app fills the answer in the browser and saves a memory record with field label, nearby text, input type, page URL or hostname, and normalized answer.
6. The run continues until the current page is filled, then stops at a review state.
7. If there is a clear Next button, the app can advance one step at a time, but still stops before final submission.

## Data Model

### ApplicantProfile

- `fullName`
- `email`
- `phone`
- `location`
- `linkedinUrl`
- `portfolioUrl`
- `workAuthorization`
- `sponsorshipRequired`
- `defaultResumePath`

### LearnedAnswer

- `id`
- `normalizedLabel`
- `rawLabel`
- `controlType`
- `pageHost`
- `pagePathPattern`
- `nearbyContext`
- `answerType`
- `answerValue`
- `confidenceSource` (`manual`)
- `createdAt`
- `lastUsedAt`

### ApplicationRun

- `id`
- `url`
- `status`
- `currentPromptId`
- `startedAt`
- `endedAt`

## Public API

- `POST /runs` to start a run from a URL
- `GET /runs/:id` to fetch current status
- `POST /runs/:id/prompts/:promptId/respond` to answer an ambiguity prompt
- `GET /profile` and `PUT /profile`
- `GET /memory` to list learned answers
- `PATCH /memory/:id` to edit or disable a learned answer
- `GET /runs/:id/events` for live run events using Server-Sent Events

## Local Server

Run the local API with:

```bash
npm run dev:server
```

By default the server listens on `127.0.0.1:4317`. Override with `FAST_APP_HOST` and `FAST_APP_PORT` when needed.

Phase 4 run creation uses a stub runner. It creates a pending run, records an initial step, and publishes events, but it does not open a browser, scan pages, fill fields, click buttons, or submit applications.

## Matching and Memory Rules

V1 matching should stay conservative:

- Normalize labels through lowercase conversion, punctuation stripping, and whitespace collapse
- Support a small alias table for common profile fields like full name, first name, last name, email, phone, city, and LinkedIn
- Only reuse learned answers automatically when label and control type match strongly, plus either the same host or strongly similar context

If confidence is below the threshold, the app should ask instead of guessing.

Every user-confirmed answer should be stored, but v1 should not over-generalize across unrelated sites.

The prompt UI should include a manual reuse checkbox so the user can choose not to memorize one-off answers.

## Why This Shape

- Visible browser for trust and debugging
- Local-first storage for privacy
- Conservative matching to avoid bad submissions

## Local Development

The local development flow should cover:

- Installing dependencies
- Installing Playwright browsers
- Running server and client
- Opening the dashboard

## Configuration

The app should document:

- Where profile data lives
- Where the SQLite database lives
- Where the persistent browser profile lives
- How screenshots and logs are stored

## How To Use

1. Fill in your applicant profile.
2. Start a run with a job URL.
3. Watch the browser fill fields.
4. Answer prompts when the app is uncertain.
5. Review the page before moving on.

## Memory Behavior

- Confirmed answers can be remembered for reuse
- Auto-reuse should only happen on strong matches
- Saved answers should be editable or disableable later

## Safety Notes

- Stop-before-submit is the default
- CAPTCHAs and login interruptions may require manual action

## Expandability Seams

The design should preserve a few extension points from the start:

- A `FieldResolver` pipeline interface so future resolvers can be added without changing the runner
- A `SiteAdapter` interface, even if v1 only ships with a generic DOM adapter
- A submission layer kept separate from fill logic so safe auto-submit can be added later
- Memory records rich enough to support future embeddings or smarter similarity without changing the database conceptually

Planned resolver categories:

- Profile resolver
- Learned-answer resolver
- Future semantic resolver
- Future site adapter resolver

## Test Plan

### Unit Tests

- Label normalization and alias matching
- Profile field resolution
- Learned-answer confidence decisions
- Prompt creation and response handling

### Integration Tests

- A synthetic multi-step form with common fields fills from profile
- An unknown field pauses and creates a prompt
- A user response resumes the run and stores memory
- A later similar form reuses the stored answer when confidence is high
- The final submit button is never clicked automatically in v1

### Manual QA

- Verify the browser is visible and interactions are observable
- Verify the session persists across app restarts
- Verify editing a learned answer changes later behavior
- Verify ambiguous radio and select questions ask instead of guessing

## Assumptions

- The first release is for a single local user on their own machine
- Authentication to job sites is handled manually in the visible persistent browser when needed
- V1 optimizes for reliability and user control over speed
- Generic HTML form support is enough for the first iteration
- Site-specific reliability improvements come later through adapters
- Minimal code is prioritized over abstraction depth, but resolver and adapter interfaces should be introduced early to avoid a rewrite

## Future Roadmap

- Site adapters
- Resume parsing
- Better semantic matching
- Draft application tracking
