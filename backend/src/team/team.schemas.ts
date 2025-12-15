import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  avatarUrl: z.string().url().optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
