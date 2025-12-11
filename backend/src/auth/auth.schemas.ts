import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const refreshTokensSchema = z.object({
  refreshToken: z.string(),
});

export class RefreshTokensDto extends createZodDto(refreshTokensSchema) {}
