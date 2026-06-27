# Decision Log

## 2026-06-26 - Phase 1 workspace foundation

- Status: Accepted
- Context: The repository needed a minimal monorepo foundation before any runtime behavior could be added.
- Decision:
  - Use npm workspaces at the root for `apps/*` and `packages/*`.
  - Use TypeScript project references to keep server, client, and shared builds separate.
  - Use root `tsc -b` as the default build entry point so referenced packages build in dependency order.
  - Keep Phase 1 runtime code limited to placeholder entry points only.
  - Use Vitest for tooling smoke checks because it runs TypeScript tests with low setup overhead.
- Consequences:
  - The repository now has a small installable workspace skeleton without leaking into later phases.
  - Future phases can add Fastify, React, Playwright, SQLite, and Zod on top of an existing workspace boundary.

## 2026-06-27 - Phase 2 shared contracts and field vocabulary

- Status: Accepted
- Context: The repository needed a single shared contract layer before persistence, routes, resolver logic, or UI state handling could be built safely.
- Decision:
  - Use Zod schemas in `packages/shared` as the canonical source of truth for profile, learned-answer, run, prompt, live-event, and API transport payloads.
  - Export inferred TypeScript types from those schemas through the shared package entry point instead of duplicating interfaces on the server or client side.
  - Use string unions over enums for run states, prompt states, answer types, control types, and event types.
  - Keep field aliases and normalization helpers in shared code so later matching logic can rely on one stable vocabulary and one deterministic normalization layer.
  - Keep normalization helpers pure and composable rather than combining them into resolver-specific matching logic during Phase 2.
- Consequences:
  - Future server routes, repositories, resolvers, and client API helpers can build on a consistent shared contract surface.
  - Invalid transport and workflow states are now rejected earlier in tests and, later, at runtime boundaries.
  - Later phases can focus on behavior and persistence without redefining profile, memory, run, prompt, or event payloads.
