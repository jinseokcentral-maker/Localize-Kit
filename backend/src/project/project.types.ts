import type { Tables } from '../type/supabse';

export type ProjectRow = Tables<'projects'>;
export type TeamMemberRow = Tables<'team_members'>;

export type Project = Readonly<{
  id: string;
  name: string;
  description: string | null;
  languages: string[] | null;
  defaultLanguage: string | null;
  slug: string;
  ownerId: string;
  createdAt: string | null;
  updatedAt: string | null;
}>;

export type ProjectList = ReadonlyArray<Project>;

