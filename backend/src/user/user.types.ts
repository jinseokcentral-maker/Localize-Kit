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
  teams: TeamInfo[];
}>;

export type TeamInfo = Readonly<{
  teamId: string | null;
  projectCount: number;
  plan: string | null;
  canCreateProject: boolean;
  teamName: string;
  memberCount: number;
  avatarUrl: string | null;
  personal: boolean;
}>;
