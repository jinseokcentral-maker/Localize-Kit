import { z } from 'zod';

const roleEnum = z.enum(['owner', 'editor', 'viewer']);

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  languages: z.array(z.string()).optional(),
  defaultLanguage: z.string().optional(),
  slug: z.string().min(1).max(200).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  languages: z.array(z.string()).optional(),
  defaultLanguage: z.string().optional(),
  slug: z.string().min(1).max(200).optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: roleEnum,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type ProjectRole = z.infer<typeof roleEnum>;

