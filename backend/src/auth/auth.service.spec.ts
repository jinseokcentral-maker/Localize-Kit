import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Effect } from 'effect';
import { AuthService } from './auth.service';
import { InvalidTokenError } from './errors/auth.errors';
import type { JwtPayload } from './guards/jwt-auth.guard';

describe('AuthService', () => {
  let authService: AuthService;
  const jwtService = {
    sign: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;
  const configService = {
    get: jest.fn(),
  } as unknown as ConfigService;

  const payload: JwtPayload = { sub: 'user-1', email: 'a@b.com', plan: null };

  beforeEach(() => {
    jest.resetAllMocks();
    configService.get = jest.fn().mockReturnValue('7d');
    authService = new AuthService(configService, jwtService);
  });

  it('issues access and refresh tokens', () => {
    jwtService.sign = jest
      .fn()
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const tokens = authService.issueTokens(payload);

    expect(tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(jwtService.sign).toHaveBeenCalledTimes(2);
  });

  it('refreshes tokens when refresh token is valid', async () => {
    jwtService.verifyAsync = jest.fn().mockResolvedValue(payload);
    jwtService.sign = jest
      .fn()
      .mockReturnValueOnce('new-access')
      .mockReturnValueOnce('new-refresh');

    const result = await Effect.runPromise(
      authService.refreshTokens('refresh'),
    );

    expect(result).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('refresh');
  });

  it('fails to refresh tokens when refresh token is invalid', async () => {
    jwtService.verifyAsync = jest
      .fn()
      .mockRejectedValue(new Error('bad token'));

    const result = await Effect.runPromise(
      Effect.either(authService.refreshTokens('refresh')),
    );

    expect(result._tag).toBe('Left');
    // narrow
    if (result._tag === 'Left') {
      expect(result.left).toBeInstanceOf(InvalidTokenError);
    }
  });
});
