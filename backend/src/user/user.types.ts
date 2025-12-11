import type { Tables } from '../type/supabse';

export type UserProfileRow = Tables<'profiles'>;

export type User = Readonly<{
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  plan: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}>;

