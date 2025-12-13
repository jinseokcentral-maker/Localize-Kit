import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { Effect, pipe } from 'effect';
import { Public } from '../auth/decorators/auth-access.decorator';
import type { JwtPayload } from '../auth/guards/jwt-auth.guard';
import { toUnauthorizedException } from '../common/errors/unauthorized-error';
import { runEffectWithErrorHandling } from '../common/effect/effect.util';
import {
  ResponseEnvelopeDto,
  type ResponseEnvelope,
} from '../common/response/response.schema';
import { buildResponse } from '../common/response/response.util';
import { UserService } from './user.service';
import { registerUserSchema, updateUserSchema } from './user.schemas';
import type { RegisterUserInput, UpdateUserInput } from './user.schemas';
import type { User } from './user.types';
import { ZodError } from 'zod';

type AuthenticatedRequest = {
  user?: JwtPayload;
};

const errorSchema: SchemaObject = {
  type: 'object',
  properties: {
    statusCode: { type: 'number' },
    message: { type: 'string' },
    error: { type: 'string' },
  },
  required: ['statusCode', 'message'],
};

const registerRequestSchema: SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    fullName: { type: 'string' },
    avatarUrl: { type: 'string', format: 'uri' },
    plan: { type: 'string' },
  },
  required: ['id', 'email'],
};

const updateRequestSchema: SchemaObject = {
  type: 'object',
  properties: {
    fullName: { type: 'string' },
    avatarUrl: { type: 'string', format: 'uri' },
    plan: { type: 'string' },
  },
};

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: oneOfString('email'),
    fullName: oneOfString(),
    avatarUrl: oneOfString('uri'),
    plan: oneOfString(),
    createdAt: oneOfString('date-time'),
    updatedAt: oneOfString('date-time'),
  },
  required: ['id'],
} satisfies SchemaObject;

function mapUserError(err: unknown): Error {
  if (err instanceof ZodError) {
    return new BadRequestException(err.issues);
  }
  if (err instanceof Error) {
    return err;
  }
  return toUnauthorizedException(err);
}

function oneOfString(format?: string): SchemaObject {
  return {
    oneOf: [
      { type: 'string', ...(format !== undefined ? { format } : {}) },
      { type: 'null' },
    ],
  };
}

@ApiTags('users')
@ApiBearerAuth('jwt')
@ApiExtraModels(ResponseEnvelopeDto)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    description: 'User registration payload',
    schema: registerRequestSchema,
  })
  @ApiOkResponse({
    description: 'Created user and JWT token',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseEnvelopeDto) },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                user: userSchema,
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },
      ],
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request',
    schema: errorSchema,
  })
  @ApiConflictResponse({ description: 'User already exists' })
  register(
    @Body() body: unknown,
  ): Promise<
    ResponseEnvelope<{ user: User; accessToken: string; refreshToken: string }>
  > {
    return runEffectWithErrorHandling(
      pipe(
        Effect.try({
          try: () => registerUserSchema.parse(body),
          catch: (err) => err,
        }),
        Effect.flatMap((input: RegisterUserInput) =>
          this.userService.registerUser(input),
        ),
        Effect.map((payload) => buildResponse(payload)),
      ),
      mapUserError,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({
    description: 'Current user',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseEnvelopeDto) },
        { properties: { data: userSchema } },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getMe(@Req() req: AuthenticatedRequest): Promise<ResponseEnvelope<User>> {
    return runEffectWithErrorHandling(
      pipe(
        this.requireAuthUser(req),
        Effect.flatMap((userId) => this.userService.getUserById(userId)),
        Effect.map((user) => buildResponse(user)),
      ),
      mapUserError,
    );
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ description: 'User update payload', schema: updateRequestSchema })
  @ApiOkResponse({
    description: 'Updated user',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseEnvelopeDto) },
        { properties: { data: userSchema } },
      ],
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request',
    schema: errorSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  updateMe(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<ResponseEnvelope<User>> {
    return runEffectWithErrorHandling(
      pipe(
        Effect.all({
          userId: this.requireAuthUser(req),
          input: Effect.try({
            try: () => updateUserSchema.parse(body),
            catch: (err) => err,
          }),
        }),
        Effect.flatMap(({ userId, input }) =>
          this.userService.updateUser(userId, input as UpdateUserInput),
        ),
        Effect.map((user) => buildResponse(user)),
      ),
      mapUserError,
    );
  }

  private requireAuthUser(
    req: AuthenticatedRequest,
  ): Effect.Effect<string, Error> {
    return Effect.fromNullable(req.user?.sub).pipe(
      Effect.orElseFail(() => new Error('Unauthorized')),
    );
  }
}
