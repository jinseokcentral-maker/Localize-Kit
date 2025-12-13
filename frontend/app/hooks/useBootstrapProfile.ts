import { useEffect, useRef } from "react";
import { Effect } from "effect";
import { useLocation, useNavigate } from "react-router";
import { supabase } from "~/lib/supabaseClient";
import { apiClient } from "~/lib/api/authClient";
import { authControllerLoginWithProvider } from "../api";
import { useTokenStore } from "../stores/tokenStore";
import { useSupabase } from "./useAuth";

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
          try: () =>
            authControllerLoginWithProvider({
              client: apiClient,
              body: { accessToken: supabaseAccess },
              throwOnError: true,
            }),
          catch: (err) => err,
        }),
      );

      const accessToken = loginRes.data?.data?.accessToken;
      const refreshToken = loginRes.data?.data?.refreshToken;

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
