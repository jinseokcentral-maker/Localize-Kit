import { useEffect, useState } from "react";
import { Effect } from "effect";

import { isSupabaseConfigured, supabase } from "~/lib/supabaseClient";

export function useSupabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!isSupabaseConfigured) {
      if (!cancelled) {
        setIsInitialized(true);
        setIsSupabaseReady(false);
        setIsAuthenticated(false);
      }
      return () => {
        cancelled = true;
      };
    }

    setIsSupabaseReady(true);

    // Setup auth state change listener (synchronous)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setIsAuthenticated(!!session?.user);
      }
    });

    // Get initial session using Effect
    const sessionEffect = Effect.gen(function* (_) {
      const sessionRes = yield* _(
        Effect.tryPromise({
          try: () => supabase.auth.getSession(),
          catch: (err) => err as Error,
        }),
      );

      if (!cancelled) {
        setIsAuthenticated(!!sessionRes.data.session?.user);
        setIsInitialized(true);
      }
    });

    Effect.runPromise(
      sessionEffect.pipe(Effect.catchAll(() => Effect.void)),
    ).catch(() => {
      // Handle error silently or set error state if needed
      if (!cancelled) {
        setIsInitialized(true);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return {
    isSupabaseReady,
    isInitialized,
    isAuthenticated,
  };
}
