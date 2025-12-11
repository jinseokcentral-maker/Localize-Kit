import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
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
import { RefreshTokensDto, refreshTokensSchema } from './auth.schemas';
import { InvalidTokenError } from './errors/auth.errors';
import { toUnauthorizedException } from '../common/errors/unauthorized-error';
import { ResponseEnvelopeDto } from '../common/response/response.schema';
import { buildResponse } from '../common/response/response.util';
import type { ResponseEnvelope } from '../common/response/response.schema';

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
@ApiExtraModels(RefreshTokensDto, ResponseEnvelopeDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    return pipe(
      Effect.try({
        try: () => refreshTokensSchema.parse(body),
        catch: (err) => err,
      }),
      Effect.flatMap((parsed) =>
        this.authService.refreshTokens(parsed.refreshToken),
      ),
      Effect.catchAll((err) => Effect.fail(mapAuthError(err))),
      Effect.map((tokens) => buildResponse(tokens)),
      Effect.runPromise,
    );
  }
}

function mapAuthError(err: unknown): Error {
  if (err instanceof InvalidTokenError) {
    return toUnauthorizedException(err);
  }
  if (err instanceof Error) {
    return err;
  }
  return new BadRequestException('Invalid request');
}
