import { z } from 'zod';

export const registerUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().optional(),
  plan: z.string().min(1).max(100).optional(),
  refreshTokenExpiresIn: z.string().optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().optional(),
  plan: z.string().min(1).max(100).optional(),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

