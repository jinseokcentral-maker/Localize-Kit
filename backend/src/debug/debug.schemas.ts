import { z } from 'zod';

export const updateUserPlanSchema = z.object({
  userId: z.string().uuid().optional(),
  plan: z.enum(['free', 'pro']),
});

export type UpdateUserPlanInput = z.infer<typeof updateUserPlanSchema>;
