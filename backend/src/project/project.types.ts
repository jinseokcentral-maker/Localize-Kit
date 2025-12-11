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

export const projectSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    description: { oneOf: [{ type: 'string' }, { type: 'null' }] },
    languages: {
      oneOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }],
    },
    defaultLanguage: { oneOf: [{ type: 'string' }, { type: 'null' }] },
    slug: { type: 'string' },
    ownerId: { type: 'string' },
    createdAt: {
      oneOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
    },
    updatedAt: {
      oneOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
    },
  },
  required: ['id', 'name', 'slug', 'ownerId'],
} as const;
