import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { z } from 'zod';
import { Data, Effect, pipe } from 'effect';
import {
  AUTH_ACCESS,
  AUTH_ACCESS_LEVEL_KEY,
  type AuthAccessLevel,
} from '../constants/auth.constants';
import { toUnauthorizedException } from '../../common/errors/unauthorized-error';
import {
  InvalidAuthSchemeError,
  InvalidTokenError,
  MissingAuthHeaderError,
} from '../errors/auth.errors';

const BEARER_PREFIX = 'Bearer ';

type RequestWithUser = {
  user?: JwtPayload;
  headers: Record<string, string | string[] | undefined>;
};

export const jwtPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email().nullish(),
  plan: z.string().nullish(),
  exp: z.number().optional(),
  iat: z.number().optional(),
});

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithUser>();
    const accessLevel = this.getAccessLevel(context);

    if (accessLevel === AUTH_ACCESS.public) {
      return true;
    }

    try {
      return await Effect.runPromise(
        pipe(
          this.extractBearerToken(request),
          Effect.flatMap((token) => this.verifyToken(token)),
          Effect.tap((payload) => {
            request.user = payload;
          }),
          Effect.as(true),
        ),
      );
    } catch (err) {
      throw toUnauthorizedException(err);
    }
  }

  private getAccessLevel(context: ExecutionContext): AuthAccessLevel {
    return (
      this.reflector.getAllAndOverride<AuthAccessLevel | undefined>(
        AUTH_ACCESS_LEVEL_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? AUTH_ACCESS.private
    );
  }

  private extractBearerToken(
    request: RequestWithUser,
  ): Effect.Effect<string, MissingAuthHeaderError | InvalidAuthSchemeError> {
    const header = request.headers.authorization;
    return Effect.fromNullable(header).pipe(
      Effect.orElseFail(() => new MissingAuthHeaderError()),
      Effect.flatMap((value) =>
        typeof value === 'string'
          ? Effect.succeed(value)
          : Effect.fail(new InvalidAuthSchemeError()),
      ),
      Effect.flatMap((value) =>
        value.startsWith(BEARER_PREFIX)
          ? Effect.succeed(value.slice(BEARER_PREFIX.length))
          : Effect.fail(new InvalidAuthSchemeError()),
      ),
    );
  }

  private verifyToken(
    token: string,
  ): Effect.Effect<JwtPayload, InvalidTokenError> {
    return Effect.tryPromise({
      try: async () => this.jwtService.verifyAsync(token),
      catch: (err) =>
        new InvalidTokenError({
          reason: err instanceof Error ? err.message : 'Invalid token',
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
}
