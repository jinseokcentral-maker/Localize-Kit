import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { Effect, pipe } from 'effect';
import { JWT_REFRESH_EXPIRES_IN_KEY } from './constants/auth.constants';
import { InvalidTokenError } from './errors/auth.errors';
import { jwtPayloadSchema, type JwtPayload } from './guards/jwt-auth.guard';

export type TokenPair = Readonly<{
  accessToken: string;
  refreshToken: string;
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  issueTokens(payload: JwtPayload): TokenPair {
    return {
      accessToken: this.signAccessToken(payload),
      refreshToken: this.signRefreshToken(payload),
    };
  }

  refreshTokens(
    refreshToken: string,
  ): Effect.Effect<TokenPair, InvalidTokenError> {
    return pipe(
      this.verifyRefreshToken(refreshToken),
      Effect.map((payload) => this.issueTokens(payload)),
    );
  }

  private verifyRefreshToken(
    refreshToken: string,
  ): Effect.Effect<JwtPayload, InvalidTokenError> {
    return Effect.tryPromise({
      try: async () => this.jwtService.verifyAsync(refreshToken),
      catch: (err) =>
        new InvalidTokenError({
          reason: err instanceof Error ? err.message : 'Invalid refresh token',
        }),
    }).pipe(
      Effect.flatMap((payload) =>
        Effect.try({
          try: () => jwtPayloadSchema.parse(payload),
          catch: (err) =>
            new InvalidTokenError({
              reason:
                err instanceof Error ? err.message : 'Invalid token payload',
            }),
        }),
      ),
    );
  }

  private signAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign({
      sub: payload.sub,
      email: payload.email,
      plan: (payload as Record<string, unknown>).plan ?? null,
    });
  }

  private signRefreshToken(payload: JwtPayload): string {
    const expiresIn =
      this.requireRefreshExpires() as unknown as JwtSignOptions['expiresIn'];
    return this.jwtService.sign(
      {
        sub: payload.sub,
        email: payload.email,
      },
      { expiresIn },
    );
  }

  private requireRefreshExpires(): string {
    return Effect.runSync(
      Effect.fromNullable(
        this.configService.get<string>(JWT_REFRESH_EXPIRES_IN_KEY),
      ).pipe(
        Effect.orElseFail(
          () =>
            new Error(
              `Environment variable ${JWT_REFRESH_EXPIRES_IN_KEY} is required`,
            ),
        ),
      ),
    );
  }
}
