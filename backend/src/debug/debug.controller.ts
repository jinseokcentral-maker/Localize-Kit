import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Effect, pipe } from 'effect';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  updateUserPlanSchema,
  type UpdateUserPlanInput,
} from './debug.schemas';
import { runEffectWithErrorHandling } from '../common/effect/effect.util';
import type { JwtPayload } from '../auth/guards/jwt-auth.guard';
import { ProfileEntity } from '../database/entities/profile.entity';
import { UnauthorizedError } from '../common/errors/unauthorized-error';

type AuthenticatedRequest = {
  user?: JwtPayload;
};

@ApiTags('debug')
@Controller('debug')
export class DebugController {
  constructor(private readonly em: EntityManager) {}

  @Post('users/plan')
  @ApiOperation({ summary: 'Debug: update user personal plan (free|pro)' })
  updateUserPlan(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<{ success: true }> {
    return runEffectWithErrorHandling(
      pipe(
        Effect.all({
          input: Effect.try({
            try: () => updateUserPlanSchema.parse(body),
            catch: (err) => err,
          }),
          callerId: this.requireUserId(req),
        }),
        Effect.tap(() => this.ensureNonProduction()),
        Effect.flatMap(({ input, callerId }) =>
          this.applyUserPlan(input as UpdateUserPlanInput, callerId),
        ),
        Effect.map(() => ({ success: true as const })),
      ),
      mapDebugError,
    );
  }

  private applyUserPlan(
    input: UpdateUserPlanInput,
    callerId: string,
  ): Effect.Effect<void, Error> {
    const targetUserId = input.userId ?? callerId;
    return Effect.tryPromise({
      try: async () => {
        const profile = await this.em.findOne(ProfileEntity, {
          id: targetUserId,
        });
        if (!profile) {
          throw new BadRequestException('User profile not found');
        }
        profile.plan = input.plan;
        await this.em.persistAndFlush(profile);
      },
      catch: (err) =>
        err instanceof Error ? err : new Error('Update plan failed'),
    });
  }

  private ensureNonProduction(): Effect.Effect<void, Error> {
    return Effect.try(() => {
      if (process.env.NODE_ENV === 'production') {
        throw new ForbiddenException('Not allowed in production');
      }
    });
  }

  private requireUserId(
    req: AuthenticatedRequest,
  ): Effect.Effect<string, Error> {
    return Effect.fromNullable(req.user?.sub).pipe(
      Effect.orElseFail(
        () => new UnauthorizedError({ reason: 'Unauthorized' }),
      ),
    );
  }
}

function mapDebugError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }
  return new BadRequestException('Invalid request');
}
