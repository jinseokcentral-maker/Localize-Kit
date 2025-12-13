import { useEffect, useState } from "react";
import { Effect } from "effect";

type LoadStatus = "idle" | "loading" | "loaded" | "error";

/**
 * Lazy-loads the WASM parser on the client without blocking initial render.
 * Logs success/failure to the console. Returns current load status for optional use.
 */
export function useLoadWasmParser(): LoadStatus {
  const [status, setStatus] = useState<LoadStatus>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;

    setStatus("loading");

    const loadWasmEffect = Effect.gen(function* (_) {
      // Dynamic import of parser module
      const parserModule = yield* _(
        Effect.tryPromise({
          try: () => import("~/lib/parser/index"),
          catch: (err) => err as Error,
        }),
      );

      // Initialize WASM
      yield* _(
        Effect.tryPromise({
          try: () => parserModule.initWasm?.(),
          catch: (err) => err as Error,
        }),
      );

      setStatus("loaded");
      console.info("[LocalizeKit] WASM parser loaded");
    });

    Effect.runPromise(
      loadWasmEffect.pipe(
        Effect.catchAll((err) => {
          setStatus("error");
          console.warn("[LocalizeKit] WASM parser load failed", err);
          return Effect.void;
        }),
      ),
    );
  }, []);

  return status;
}
