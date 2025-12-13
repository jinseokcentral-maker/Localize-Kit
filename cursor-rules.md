# Cursor Rules

- Do **not** use `useCallback` or `useMemo` anywhere in this project. Prefer direct values or inline functions instead of memoization hooks.
- **Always write unit tests for logic functions and features.** Test files should be placed in a `tests/` directory alongside the code being tested, or in a dedicated test directory structure.
- When adding new functions, follow the Effect-style pattern: keep functions pure/deterministic, avoid hidden side effects, return effects/results instead of throwing, and compose/chain errors explicitly.
- Effect rules (from `.cursor/effect.txt`):
  - Model effects as values: use `Effect.tryPromise` / `Effect.gen` (or equivalent) to wrap async work instead of running it inline.
  - Use tagged errors and precise types (prefer branded identifiers); return typed errors, don’t throw.
  - Compose with `Effect.andThen`/`pipe` instead of deeply nested async/await.
  - Keep functions pure; no hidden side effects. Side effects live in Effect pipelines.
  - Validate external responses (e.g., `effect/Schema` or `zod`) before use.
  - Batch and dedupe external calls when possible (see batching guidance).
- Prefer React Suspense for data fetching/UI async flows: use TanStack Query's `useSuspenseQuery` with Suspense + ErrorBoundary wrappers; keep components in happy-path mode and push loading/error handling to boundaries. **Always wrap Suspense with ErrorBoundary** - Suspense handles loading states, ErrorBoundary handles error states. Never use Suspense without ErrorBoundary.
- Use `nuqs` and `tanstack query` proactively to minimize props: Use `nuqs`'s `useQueryState` for URL state management, and `tanstack query` for server state. Each component should read its required state directly rather than receiving it via props to avoid props drilling.
