import { create } from "zustand";

import { supabase } from "~/lib/supabaseClient";
import type { Tables } from "type/supabse";



type UserProfile = Tables<"profiles">;

export interface UserStore {

  profile: UserProfile | null;

  setProfile: (profile: UserProfile | null) => void;
  fetchProfile: () => Promise<UserProfile | null>;
  registerUser: (
    payload?: Partial<UserProfile>
  ) => Promise<{ data?: UserProfile; error?: unknown }>;
}

export const useUserStore = create<UserStore>()((set, get) => ({

  profile: null,
  presence: "unknown",

  setProfile: (profile) => set({ profile }),

  fetchProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ profile: null });
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single<UserProfile>();

    if (error) {
      return null;
    }
    set({ profile: data });
    return data;
  },

  registerUser: async (payload = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "No authenticated user" as const };
    }
    const insertPayload = {
      id: user.id,
      email: user.email ?? undefined,
      full_name: payload.full_name ?? null,
      avatar_url: payload.avatar_url ?? null,
      plan: payload.plan ?? "free",
      stripe_customer_id: payload.stripe_customer_id ?? null,
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(insertPayload)
      .select("*")
      .single<UserProfile>();

    if (error) {
      return { error };
    }

    set({ profile: data });
    return { data };
  },
}));