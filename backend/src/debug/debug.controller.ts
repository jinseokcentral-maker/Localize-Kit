import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
import { Public } from '../auth/decorators/auth-access.decorator';

type AuthenticatedRequest = {
  user?: JwtPayload;
};

@ApiTags('debug')
@Public()
@Controller('debug')
export class DebugController {
  constructor(private readonly em: EntityManager) {}

  @Post('users/plan')
  @Public()
  @ApiOperation({ summary: 'Debug: update user personal plan (free|pro)' })
  @ApiOkResponse({
    description: 'Plan updated',
    schema: {
      type: 'object',
      properties: { success: { type: 'boolean', example: true } },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  @ApiForbiddenResponse({ description: 'Not allowed in production' })
  @ApiBody({
    description: 'Update plan payload (debug only)',
    schema: {
      type: 'object',
      properties: {
        plan: { type: 'string', enum: ['free', 'pro'] },
        userId: { type: 'string', format: 'uuid', nullable: true },
      },
      required: ['plan'],
    },
  })
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
        }),
        Effect.tap(() => this.ensureNonProduction()),
        Effect.flatMap(({ input }) =>
          pipe(
            this.resolveTargetUserId(input as UpdateUserPlanInput, req),
            Effect.flatMap((targetUserId) =>
              this.applyUserPlan(input as UpdateUserPlanInput, targetUserId),
            ),
          ),
        ),
        Effect.map(() => ({ success: true as const })),
      ),
      mapDebugError,
    );
  }

  private applyUserPlan(
    input: UpdateUserPlanInput,
    targetUserId: string,
  ): Effect.Effect<void, Error> {
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

  private resolveTargetUserId(
    input: UpdateUserPlanInput,
    req: AuthenticatedRequest,
  ): Effect.Effect<string, Error> {
    return Effect.try(() => {
      const fromInput = input.userId;
      const fromJwt = req.user?.sub;
      const target = fromInput ?? fromJwt;
      if (!target) {
        throw new UnauthorizedError({ reason: 'Missing userId or auth' });
      }
      return target;
    });
  }
}

function mapDebugError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }
  return new BadRequestException('Invalid request');
}

