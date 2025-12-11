export const AUTH_ACCESS_LEVEL_KEY = 'auth:access-level';

export const AUTH_ACCESS = {
  public: 'public',
  private: 'private',
} as const;

export type AuthAccessLevel = (typeof AUTH_ACCESS)[keyof typeof AUTH_ACCESS];

export const JWT_SECRET_KEY = 'JWT_SECRET';
export const JWT_EXPIRES_IN_KEY = 'JWT_EXPIRES_IN';
export const JWT_REFRESH_EXPIRES_IN_KEY = 'JWT_REFRESH_EXPIRES_IN';
