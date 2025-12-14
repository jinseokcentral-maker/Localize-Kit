import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

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

export const projectResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  languages: z.array(z.string()).nullable(),
  defaultLanguage: z.string().nullable(),
  slug: z.string(),
  ownerId: z.string(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  archived: z.boolean(),
});

export const listProjectsSchema = z.object({
  pageSize: z.coerce.number().int().positive().default(15),
  index: z.coerce.number().int().nonnegative().default(0),
  search: z.string().optional(),
  status: z.enum(['active', 'archived']).optional(),
  sort: z.enum(['newest', 'oldest']).default('newest'),
});

export const listProjectsResponseSchema = z.object({
  items: z.array(projectResponseSchema),
  meta: z.object({
    index: z.number().int().nonnegative(),
    pageSize: z.number().int().positive(),
    hasNext: z.boolean(),
    totalCount: z.number().int().nonnegative(),
    totalPageCount: z.number().int().nonnegative(),
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type ListProjectsInput = z.infer<typeof listProjectsSchema>;
export type ListProjectsOutput = z.infer<typeof listProjectsResponseSchema>;
export type ProjectRole = z.infer<typeof roleEnum>;

export class CreateProjectDto extends createZodDto(createProjectSchema) {}
export class UpdateProjectDto extends createZodDto(updateProjectSchema) {}
export class AddMemberDto extends createZodDto(addMemberSchema) {}
export class ProjectDto extends createZodDto(projectResponseSchema) {}
export class ListProjectsResponseDto extends createZodDto(
  listProjectsResponseSchema,
) {}
