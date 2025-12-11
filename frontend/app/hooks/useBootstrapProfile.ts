import { useEffect, useState } from "react";
import { useUserStore } from "~/stores/useUserStore";
import { useAuth } from "./useAuth";

type BootstrapStatus = "idle" | "ready";

export function useBootstrapProfile() {
  const { isInitialized, isSupabaseReady, isAuthenticated } = useAuth();
  const { setProfile } = useUserStore();
  const [status, setStatus] = useState<BootstrapStatus>("idle");

  useEffect(() => {
    if (!isInitialized || !isSupabaseReady) {
      setStatus("idle");
      return;
    }
    if (!isAuthenticated) {
      setProfile(null);
      setStatus("idle");
      return;
    }

    // DB work is handled by backend; mark ready once auth is ready.
    setStatus("ready");
  }, [isInitialized, isSupabaseReady, isAuthenticated, setProfile]);

  return { status };
}