import { useEffect, useState } from "react";

import { supabase, isSupabaseConfigured } from "~/lib/supabaseClient";

export function useSupabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      if (mounted) {
        setIsInitialized(true);
        setIsSupabaseReady(false);
        setIsAuthenticated(false);
      }
      return () => {
        mounted = false;
      };
    }

    setIsSupabaseReady(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setIsAuthenticated(!!session?.user);
      setIsInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    isSupabaseReady,
    isInitialized,
    isAuthenticated,

  };
}