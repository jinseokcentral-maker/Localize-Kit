import { useEffect } from "react";
import { useUserStore } from "~/stores/useUserStore";
import { useAuth } from "./useAuth";


export function useBootstrapProfile() {
  const { isInitialized, isSupabaseReady, isAuthenticated } = useAuth();
  const { setProfile, fetchProfile, registerUser } =
    useUserStore();


  useEffect(() => {
    if (!isInitialized || !isSupabaseReady || !isAuthenticated ) {
      setProfile(null);
      return;
    }


    fetchProfile()
      .then(async (data) => {
        if (data) {
          setProfile(data);
          return;
        }

        await registerUser();
      })
      .catch((err) => {
        const message = err?.message || "Profile bootstrap failed";
      })
  }, [
    isInitialized,
    isSupabaseReady,
    isAuthenticated,
    fetchProfile,
    registerUser,
    setProfile,
  ]);


}

