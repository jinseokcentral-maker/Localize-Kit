import { create } from "zustand";

// Minimal profile shape until backend API is wired
export type UserProfile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  plan?: string | null;
  stripe_customer_id?: string | null;
};

export interface UserStore {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
}

export const useUserStore = create<UserStore>()((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}));