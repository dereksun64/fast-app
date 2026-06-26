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
