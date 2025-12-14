import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const refreshTokensSchema = z.object({
  refreshToken: z.string(),
});

export class RefreshTokensDto extends createZodDto(refreshTokensSchema) {}

export const providerLoginSchema = z.object({
  accessToken: z.string().min(1),
  teamId: z.string().uuid().optional(),
});

export const providerUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  picture: z.string().url().optional(),
});

export type ProviderUser = z.infer<typeof providerUserSchema>;

export class ProviderLoginDto extends createZodDto(providerLoginSchema) {}

export const switchTeamSchema = z.object({
  teamId: z.string().uuid(),
});

export class SwitchTeamDto extends createZodDto(switchTeamSchema) {}
