import { Effect, pipe } from 'effect';

export function runEffect<T>(
  effect: Effect.Effect<T, unknown>,
): Promise<T> {
  return Effect.runPromise(effect);
}

export function runEffectWithErrorHandling<T>(
  effect: Effect.Effect<T, unknown>,
  mapError: (err: unknown) => Error,
): Promise<T> {
  try {
    return Effect.runPromise(effect);
  } catch (err) {
    throw mapError(err);
  }
}

