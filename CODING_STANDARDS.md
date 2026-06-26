# Coding Standards

## Purpose

This document defines the coding standards for this project. The goal is to keep the codebase readable, predictable, safe to change, and easy to review as the app grows from a minimal local v1 into a more capable system.

These standards apply to all production code, test code, scripts, and documentation in this repository.

## Core Principles

- Prefer clarity over cleverness.
- Keep modules small and responsibilities explicit.
- Optimize for safe automation and human review, not hidden behavior.
- Make state transitions observable.
- Fail loudly on invalid input and uncertain assumptions.
- Keep v1 conservative: do not add abstraction unless it removes real duplication or risk.

## General Rules

### Readability

- Write code that a new contributor can understand quickly.
- Prefer explicit names over abbreviations.
- Avoid nested control flow when an early return makes the path clearer.
- Keep functions focused on one responsibility.
- Keep files cohesive. If a file is doing unrelated work, split it.

### Comments

- Use comments to explain intent, constraints, or non-obvious tradeoffs.
- Do not use comments to restate code.
- Remove stale comments in the same change that makes them stale.

### Naming

- Use domain names that match the README and product language.
- Prefer `run`, `prompt`, `profile`, `memory`, `resolver`, and `adapter` over generic names like `data`, `util`, or `handler` when the domain is known.
- Use boolean names that read as predicates, such as `isResolved`, `hasPrompt`, or `shouldPersist`.

### Errors

- Do not swallow errors silently.
- Return structured errors at API boundaries.
- Include enough context in logs to debug the failing step without exposing unnecessary sensitive data.

### Logging

- Log meaningful state transitions, not noise.
- Use structured logs for server-side events.
- Never log secrets, full resumes, or unnecessary PII.

### Testing

- Add or update tests for behavior changes.
- Prefer tests that verify externally visible behavior over internal implementation details.
- Keep fixtures minimal and representative.

## TypeScript Standards

TypeScript is the default language for application code. Use the type system to make invalid states harder to represent.

### Types

- Prefer explicit domain types over loose object literals.
- Use `type` and `interface` intentionally:
  - Use `interface` for extendable object contracts.
  - Use `type` for unions, mapped types, utility compositions, and value-level aliases.
- Prefer union types over boolean flags when there are multiple real states.
- Model application status as discriminated unions when the state drives behavior.
- Avoid `any`. Use `unknown` first and narrow it.
- Avoid non-null assertions unless the invariant is guaranteed and documented by nearby code.
- Prefer `readonly` where mutation is not intended.

### Functions

- Annotate public function return types.
- Keep parameter lists short. Group related values into typed objects when needed.
- Prefer pure functions for normalization, matching, and transformation logic.
- Push side effects to edges such as routes, repositories, or browser actions.

### Control Flow

- Narrow unknown values before use.
- Prefer exhaustive `switch` handling for discriminated unions.
- Treat unreachable states as actual bugs.

### Modules

- One file should expose one primary responsibility.
- Keep shared contracts in a shared package instead of duplicating types.
- Avoid circular dependencies. If two modules depend on each other, the boundary is wrong.

### Language Features

- Prefer modern syntax that improves clarity: `const`, `let`, optional chaining, nullish coalescing, and template literals where appropriate.
- Do not use wrapper object types like `String`, `Number`, `Boolean`, `Object`, or `Symbol`.
- Do not use `enum` unless it solves a concrete interop need. Prefer string unions for most application state.

## React and TSX Standards

The client should remain thin, declarative, and easy to reason about.

### Components

- Keep components pure: render should derive UI from props and state without hidden side effects.
- Prefer small components with explicit responsibilities.
- Keep page-level orchestration in page components and reusable UI behavior in leaf components.
- Prefer composition over large configurable components with many boolean props.

### State

- Keep state as local as possible.
- Do not duplicate derived state.
- Compute derived values during render unless the computation is expensive and proven to matter.
- Use server state, local UI state, and transient form state deliberately; do not mix them casually.

### Effects

- Do not use effects for logic that belongs in rendering or event handlers.
- Effects should synchronize with external systems, such as event streams, timers, or browser APIs.
- Clean up subscriptions and listeners reliably.

### Events and Forms

- Keep event handlers small and intention-revealing.
- Validate form input at boundaries before sending it to the server.
- Show explicit loading, success, and error states for operator actions.

### UI Structure

- Use accessible HTML first.
- Prefer semantic elements over generic `div` wrappers when a semantic element exists.
- Keep operator-facing UI explicit and observable. The user should be able to tell what the runner is doing and why it paused.

## Node.js and Fastify Standards

The server is the authoritative runtime for orchestration, persistence, and browser control.

### Server Design

- Keep request handlers thin. Route handlers should validate input, call domain services, and shape responses.
- Put orchestration logic in dedicated modules, not inline in routes.
- Treat the server as long-lived and stateful.
- Do not block the event loop with avoidable synchronous heavy work.

### Fastify Usage

- Define request and response schemas for every public route.
- Validate input at the boundary and reject invalid payloads early.
- Keep plugin registration explicit.
- Encapsulate route-specific concerns cleanly instead of relying on global mutable state.

### Concurrency and State

- Be explicit about run ownership and lifecycle state.
- Avoid hidden shared mutable state across runs.
- If a run can pause, resume, or fail, represent those transitions directly in code and persistence.

### Configuration

- Centralize environment and path configuration.
- Fail startup early if required configuration is invalid.
- Keep local paths, browser profile paths, and database paths configurable but predictable.

## Playwright Standards

Browser automation must be observable, conservative, and resilient to minor page variation.

### Interaction Rules

- Use user-facing locators when possible.
- Prefer stable locators such as labels, roles, and visible text over brittle selectors.
- Do not rely on arbitrary sleeps. Wait on conditions, locators, or events.
- Keep one clear browser action per step when possible.

### Reliability

- Treat navigation, prompts, and form filling as explicit workflow steps.
- Capture enough context on failure to debug the issue, including the current page, field, and recent action.
- Avoid over-automation. If confidence is low, pause and ask.

### Test and Runner Design

- Separate page scanning, field resolution, and browser interaction concerns.
- Keep generic form handling independent from future site-specific adapters.
- Never implement auto-submit in v1.

## SQLite and SQL Standards

Persistence should remain simple, local, and auditable.

### Schema Design

- Prefer a small number of well-defined tables.
- Use primary keys consistently.
- Add timestamps for records whose lifecycle matters.
- Use foreign keys where relationships exist and keep them enabled.

### Queries

- Use parameterized queries only. Never interpolate untrusted values into SQL strings.
- Keep queries readable and close to the repository methods that use them.
- Prefer explicit column lists over `SELECT *` in application code.

### Data Integrity

- Normalize stored matching inputs where needed, but preserve raw source values when they are useful for auditability.
- Treat learned answers as user-confirmed data, not globally true facts.
- Separate mutable operational state from longer-lived memory records.

### Migrations

- Store schema changes as ordered migrations.
- Make migrations repeatable, deterministic, and easy to inspect.
- Do not edit an already-applied migration in place.

## HTML and CSS Standards

The operator dashboard should be minimal, legible, and accessible.

### HTML

- Prefer semantic HTML elements.
- Use buttons for actions, labels for form controls, and lists for repeated status items.
- Preserve keyboard accessibility and visible focus states.

### CSS

- Keep styles organized by component or page responsibility.
- Prefer design tokens or CSS variables for repeated values.
- Avoid magic numbers unless the reason is clear.
- Keep the UI readable under real operational use, including dense logs and prompt queues.

## API and Schema Standards

- Define schemas for external payloads and shared event shapes.
- Validate all inbound data before it reaches domain logic.
- Keep event payloads versionable and explicit.
- Use names that reflect operator meaning, not transport mechanics.

## Testing Standards

### Unit Tests

- Cover normalization, alias matching, confidence thresholds, and prompt lifecycle logic.
- Prefer deterministic inputs and outputs.
- Avoid mocking when a plain input-output test is sufficient.

### Integration Tests

- Test the real interaction between routes, orchestration, persistence, and browser-facing workflow boundaries.
- Cover pause and resume behavior explicitly.
- Verify that unsafe actions are not performed automatically.

### End-to-End Expectations

- Visible browser behavior must remain inspectable by a human operator.
- The app must stop before final submission.
- Unknown or ambiguous fields must create a prompt rather than a guess.

## Documentation Standards

- Keep the README aligned with actual product scope.
- Document architectural decisions when they affect future work.
- Update trackers and implementation notes when major behavior changes.
- If a behavior is intentionally conservative or intentionally unsupported, document that explicitly.

## Code Review Checklist

Before merging, confirm:

- The change matches v1 scope.
- New logic is readable and testable.
- Types are explicit enough to prevent misuse.
- UI behavior is observable and safe.
- Browser automation does not guess when uncertain.
- Database writes preserve auditability.
- Tests cover the changed behavior or the gap is explicitly noted.

## References

These standards are aligned to official guidance and current best practices from:

- TypeScript Handbook: [https://www.typescriptlang.org/docs/handbook/intro.html](https://www.typescriptlang.org/docs/handbook/intro.html)
- TypeScript Everyday Types: [https://www.typescriptlang.org/docs/handbook/2/everyday-types.html](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- Node.js Learn: [https://nodejs.org/en/learn](https://nodejs.org/en/learn)
- Node.js event loop guidance: [https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
- React docs: [https://react.dev/learn](https://react.dev/learn)
- Playwright best practices: [https://playwright.dev/docs/best-practices](https://playwright.dev/docs/best-practices)
- Fastify documentation: [https://fastify.dev/docs/latest/](https://fastify.dev/docs/latest/)
- SQLite documentation: [https://www.sqlite.org/docs.html](https://www.sqlite.org/docs.html)
- SQLite foreign keys: [https://www.sqlite.org/foreignkeys.html](https://www.sqlite.org/foreignkeys.html)
