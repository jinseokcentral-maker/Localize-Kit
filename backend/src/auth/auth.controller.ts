import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Effect, pipe } from 'effect';
import { Public } from './decorators/auth-access.decorator';
import { AuthService } from './auth.service';
import {
  ProviderLoginDto,
  RefreshTokensDto,
  SwitchTeamDto,
  providerLoginSchema,
  refreshTokensSchema,
  switchTeamSchema,
} from './auth.schemas';
import {
  InvalidTeamError,
  InvalidTokenError,
  ProviderAuthError,
  TeamAccessForbiddenError,
} from './errors/auth.errors';
import { UnauthorizedError } from '../common/errors/unauthorized-error';
import { errorMessages } from '../common/errors/error-messages';
import {
  runEffectWithErrorHandling,
  unwrapFiberFailure,
} from '../common/effect/effect.util';
import { ResponseEnvelopeDto } from '../common/response/response.schema';
import { buildResponse } from '../common/response/response.util';
import type { ResponseEnvelope } from '../common/response/response.schema';
import type { JwtPayload } from './guards/jwt-auth.guard';
import { ZodError } from 'zod';

type AuthenticatedRequest = {
  user?: JwtPayload;
};

const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number' },
    message: { type: 'string' },
    error: { type: 'string' },
  },
  required: ['statusCode', 'message'],
};

@ApiTags('auth')
@ApiExtraModels(
  RefreshTokensDto,
  ProviderLoginDto,
  SwitchTeamDto,
  ResponseEnvelopeDto,
)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with Google access token' })
  @ApiOkResponse({
    description: 'Issued token pair',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseEnvelopeDto) },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
              required: ['accessToken', 'refreshToken'],
            },
          },
        },
      ],
    },
  })
  @ApiBody({
    description: 'Provider access token payload',
    schema: { $ref: getSchemaPath(ProviderLoginDto) },
  })
  @ApiBadRequestResponse({
    description: 'Invalid payload',
    schema: errorSchema,
  })
  async loginWithProvider(
    @Body() body: unknown,
  ): Promise<ResponseEnvelope<{ accessToken: string; refreshToken: string }>> {
    return runEffectWithErrorHandling(
      pipe(
        Effect.try({
          try: () => providerLoginSchema.parse(body),
          catch: (err) => err,
        }),
        Effect.flatMap((parsed) =>
          this.authService.loginWithGoogleAccessToken(
            parsed.accessToken,
            parsed.teamId,
          ),
        ),
        Effect.map((tokens) => buildResponse(tokens)),
      ),
      mapAuthError,
    );
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access/refresh tokens' })
  @ApiOkResponse({
    description: 'New token pair',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseEnvelopeDto) },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
              required: ['accessToken', 'refreshToken'],
            },
          },
        },
      ],
    },
  })
  @ApiBody({
    description: 'Refresh token payload',
    schema: { $ref: getSchemaPath(RefreshTokensDto) },
  })
  @ApiBadRequestResponse({
    description: 'Invalid payload',
    schema: errorSchema,
  })
  async refreshTokens(
    @Body() body: unknown,
  ): Promise<ResponseEnvelope<{ accessToken: string; refreshToken: string }>> {
    return runEffectWithErrorHandling(
      pipe(
        Effect.try({
          try: () => refreshTokensSchema.parse(body),
          catch: (err) => err,
        }),
        Effect.flatMap((parsed) =>
          this.authService.refreshTokens(parsed.refreshToken),
        ),
        Effect.map((tokens) => buildResponse(tokens)),
      ),
      mapRefreshError,
    );
  }

  @Post('switch-team')
  @ApiOperation({ summary: 'Switch active team and get new tokens' })
  @ApiOkResponse({
    description: 'New token pair with teamId',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseEnvelopeDto) },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
              required: ['accessToken', 'refreshToken'],
            },
          },
        },
      ],
    },
  })
  @ApiBody({
    description: 'Switch team payload',
    schema: { $ref: getSchemaPath(SwitchTeamDto) },
  })
  @ApiBadRequestResponse({
    description: 'Invalid payload',
    schema: errorSchema,
  })
  async switchTeam(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<ResponseEnvelope<{ accessToken: string; refreshToken: string }>> {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedError({ reason: 'User not authenticated' });
    }
    return runEffectWithErrorHandling(
      pipe(
        Effect.try({
          try: () => switchTeamSchema.parse(body),
          catch: (err) => err,
        }),
        Effect.flatMap((parsed) =>
          this.authService.switchTeam(userId, parsed.teamId),
        ),
        Effect.map((tokens) => buildResponse(tokens)),
      ),
      mapSwitchTeamError,
    );
  }
}

function mapAuthError(err: unknown): Error {
  const unwrapped = unwrapFiberFailure(err);
  if (unwrapped instanceof ZodError) {
    return new BadRequestException(unwrapped.issues);
  }
  if (unwrapped instanceof Error) {
    return unwrapped;
  }
  return new UnauthorizedError({ reason: 'Unauthorized' });
}

function mapRefreshError(err: unknown): Error {
  const unwrapped = unwrapFiberFailure(err);
  if (unwrapped instanceof ZodError) {
    return new BadRequestException(unwrapped.issues);
  }
  if (unwrapped instanceof Error) {
    const reason = unwrapped.message || undefined;
    return new Error(errorMessages.system.refreshTokenFailed({ reason }));
  }
  return new Error(errorMessages.system.refreshTokenFailed());
}

function mapSwitchTeamError(err: unknown): Error {
  const unwrapped = unwrapFiberFailure(err);
  if (unwrapped instanceof ZodError) {
    return new BadRequestException(unwrapped.issues);
  }
  if (unwrapped instanceof Error) {
    return unwrapped;
  }
  return new UnauthorizedError({ reason: 'Unauthorized' });
}
