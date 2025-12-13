import { Cause, Effect } from 'effect';

export function runEffect<T>(effect: Effect.Effect<T, unknown>): Promise<T> {
  return Effect.runPromise(effect);
}

function findFiberFailureCauseSymbol(error: object): symbol | undefined {
  const symbols = Object.getOwnPropertySymbols(error);
  return symbols.find((s) => s.toString().includes('FiberFailure/Cause'));
}

export function unwrapFiberFailure(error: unknown): unknown {
  if (typeof error === 'object' && error !== null) {
    const causeSymbol = findFiberFailureCauseSymbol(error);
    if (causeSymbol) {
      const cause = (error as Record<symbol, unknown>)[causeSymbol];
      if (cause !== null && cause !== undefined && typeof cause === 'object') {
        try {
          const failureOption = Cause.failureOption(
            cause as Cause.Cause<unknown>,
          );
          if (failureOption._tag === 'Some') {
            return failureOption.value;
          }
          const dieOption = Cause.dieOption(cause as Cause.Cause<unknown>);
          if (dieOption._tag === 'Some') {
            return dieOption.value;
          }
        } catch {
          // Cause API 실패 시 fallback
        }
      }
    }
    if ('cause' in error) {
      const cause = (error as { cause?: unknown }).cause;
      if (cause !== null && cause !== undefined && typeof cause === 'object') {
        try {
          const failureOption = Cause.failureOption(
            cause as Cause.Cause<unknown>,
          );
          if (failureOption._tag === 'Some') {
            return failureOption.value;
          }
          const dieOption = Cause.dieOption(cause as Cause.Cause<unknown>);
          if (dieOption._tag === 'Some') {
            return dieOption.value;
          }
        } catch {
          // Cause API 실패 시 fallback
        }
      }
    }
  }
  return error;
}

export function runEffectWithErrorHandling<T>(
  effect: Effect.Effect<T, unknown>,
  mapError: (err: unknown) => Error,
): Promise<T> {
  try {
    return Effect.runPromise(effect);
  } catch (err) {
    const unwrapped = unwrapFiberFailure(err);
    throw mapError(unwrapped);
  }
}
