import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@supabase/supabase-js";
import { supabase } from "~/lib/supabaseClient";

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  plan: "free" | "pro" | "team";
  stripe_customer_id?: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

const isBrowser = typeof window !== "undefined";

const getInitialUser = (): User | null => {
  // Supabase는 자체적으로 localStorage에 세션을 관리하므로
  // 여기서는 null 반환 (실제 사용자는 supabase.auth.getSession()으로 가져옴)
  return null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: getInitialUser(),
      profile: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null });
        // Supabase가 자동으로 localStorage의 세션을 삭제함
      },
    }),
    {
      name: "localizekit-auth",
      storage: createJSONStorage(() => (isBrowser ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      // user는 Supabase가 관리하므로 persist에서 제외
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
);

