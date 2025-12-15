import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Effect, pipe } from 'effect';
import { createTeamSchema, type CreateTeamInput } from './team.schemas';
import { TeamService } from './team.service';
import { runEffectWithErrorHandling } from '../common/effect/effect.util';
import type { JwtPayload } from '../auth/guards/jwt-auth.guard';
import { UnauthorizedError } from '../common/errors/unauthorized-error';

type AuthenticatedRequest = {
  user?: JwtPayload;
};

@ApiTags('teams')
@ApiBearerAuth('jwt')
@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @ApiOperation({ summary: 'Create a team (org workspace)' })
  @ApiBadRequestResponse({
    description: 'Invalid payload',
  })
  createTeam(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<{ success: true }> {
    return runEffectWithErrorHandling(
      pipe(
        Effect.all({
          userId: this.requireUserId(req),
          input: Effect.try({
            try: () => createTeamSchema.parse(body),
            catch: (err) => err,
          }),
        }),
        Effect.flatMap(({ userId, input }) =>
          this.teamService.createTeam(userId, input as CreateTeamInput),
        ),
        Effect.map(() => ({ success: true as const })),
      ),
      mapTeamError,
    );
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

function mapTeamError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }
  return new BadRequestException('Invalid request');
}
