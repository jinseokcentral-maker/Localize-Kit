import { useEffect, useRef } from "react";
import { Effect } from "effect";
import { useLocation, useNavigate } from "react-router";
import { supabase } from "~/lib/supabaseClient";
import { apiClient } from "~/lib/api/authClient";
import { extractApiData } from "~/lib/api/apiWrapper";
import { useTokenStore } from "../stores/tokenStore";
import { useSupabase } from "./useAuth";
import { authControllerLoginWithProvider } from "~/api";

export function useBootstrapProfile() {
  const { isInitialized, isSupabaseReady, isAuthenticated } = useSupabase();
  const { setAccessToken, setRefreshToken, clear } = useTokenStore();
  const bootstrappedRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isInitialized || !isSupabaseReady) {
      return;
    }
    if (!isAuthenticated) {
      clear();
      return;
    }
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const syncEffect = Effect.gen(function* (_) {
      const sessionRes = yield* _(
        Effect.tryPromise({
          try: () => supabase.auth.getSession(),
          catch: (err) => err,
        }),
      );

      const supabaseAccess = sessionRes.data.session?.access_token;
      if (!supabaseAccess) {
        yield* _(Effect.sync(() => clear()));
        return;
      }

      const loginRes = yield* _(
        Effect.tryPromise({
          try: async () => {
            const response = await authControllerLoginWithProvider({
              client: apiClient,
              body: { accessToken: supabaseAccess },
              throwOnError: true,
            });
            return extractApiData<{
              accessToken: string;
              refreshToken: string;
            }>(response.data);
          },
          catch: (err) => err,
        }),
      );

      const accessToken = loginRes.accessToken;
      const refreshToken = loginRes.refreshToken;

      if (!accessToken) {
        yield* _(Effect.sync(() => clear()));
        return;
      }

      yield* _(
        Effect.sync(() => {
          setAccessToken(accessToken ?? null);
          setRefreshToken(refreshToken ?? null);
        }),
      );

      // redirect if needed
      if (location.pathname === "/verify") {
        yield* _(Effect.sync(() => navigate("/dashboard", { replace: true })));
      }
    });

    Effect.runPromise(
      syncEffect.pipe(
        Effect.catchAll((err) => {
          console.error("Bootstrap auth sync failed", err);
          return Effect.sync(() => clear());
        }),
      ),
    );
  }, [
    isInitialized,
    isSupabaseReady,
    isAuthenticated,
    setAccessToken,
    setRefreshToken,
    clear,
  ]);
}
