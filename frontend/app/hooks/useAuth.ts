import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "~/lib/supabaseClient";
import { useAuthStore, type UserProfile } from "~/stores/authStore";

export function useAuth() {
  const navigate = useNavigate();
  const { user, profile, setUser, setProfile, setLoading, logout: storeLogout } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // 초기 세션 로드 및 인증 상태 구독
  useEffect(() => {
    let mounted = true;

    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setUser(session?.user ?? null);
      setLoading(false);
      setIsInitialized(true);

      // 프로필 로드
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }

      // 로그인 성공 시 리다이렉트
      if (event === "SIGNED_IN" && session?.user) {
        const redirectTo = localStorage.getItem("redirectTo") || "/app";
        localStorage.removeItem("redirectTo");
        navigate(redirectTo, { replace: true });
      }

      // 로그아웃 시
      if (event === "SIGNED_OUT") {
        setProfile(null);
        navigate("/login", { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setLoading, navigate]);

  // 프로필 로드 함수
  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        return;
      }

      setProfile(data as UserProfile);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    await storeLogout();
    navigate("/login", { replace: true });
  };

  return {
    user,
    profile,
    isLoading: !isInitialized || useAuthStore.getState().isLoading,
    isAuthenticated: !!user,
    logout,
    refreshProfile: () => user && loadProfile(user.id),
  };
}

