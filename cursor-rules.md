# Cursor Rules

- Do **not** use `useCallback` or `useMemo` anywhere in this project. Prefer direct values or inline functions instead of memoization hooks.
- When adding new functions, follow the Effect-style pattern: keep functions pure/deterministic, avoid hidden side effects, return effects/results instead of throwing, and compose/chain errors explicitly.
- Effect rules (from `.cursor/effect.txt`):
  - Model effects as values: use `Effect.tryPromise` / `Effect.gen` (or equivalent) to wrap async work instead of running it inline.
  - Use tagged errors and precise types (prefer branded identifiers); return typed errors, don’t throw.
  - Compose with `Effect.andThen`/`pipe` instead of deeply nested async/await.
  - Keep functions pure; no hidden side effects. Side effects live in Effect pipelines.
  - Validate external responses (e.g., `effect/Schema` or `zod`) before use.
  - Batch and dedupe external calls when possible (see batching guidance).



