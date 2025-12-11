import { SetMetadata } from '@nestjs/common';
import { AUTH_ACCESS, AUTH_ACCESS_LEVEL_KEY, type AuthAccessLevel } from '../constants/auth.constants';

export const Public = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(AUTH_ACCESS_LEVEL_KEY, AUTH_ACCESS.public);

export const Private = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(AUTH_ACCESS_LEVEL_KEY, AUTH_ACCESS.private);

export const setAccessLevel = (
  level: AuthAccessLevel,
): ReturnType<typeof SetMetadata> =>
  SetMetadata(AUTH_ACCESS_LEVEL_KEY, level);


