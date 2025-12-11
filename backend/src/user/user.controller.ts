import { Body, Controller, Get, Post, Put, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { Effect, pipe } from 'effect';
import { Public } from '../auth/decorators/auth-access.decorator';
import type { JwtPayload } from '../auth/guards/jwt-auth.guard';
import { toUnauthorizedException } from '../common/errors/unauthorized-error';
import { UserService } from './user.service';
import { registerUserSchema, updateUserSchema } from './user.schemas';
import type { RegisterUserInput, UpdateUserInput } from './user.schemas';
import type { User } from './user.types';

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

function oneOfString(format?: string): SchemaObject {
  return {
    oneOf: [
      { type: 'string', ...(format !== undefined ? { format } : {}) },
      { type: 'null' },
    ],
  };
}

@ApiTags('users')
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
      type: 'object',
      properties: {
        user: userSchema,
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request',
    schema: errorSchema,
  })
  @ApiConflictResponse({ description: 'User already exists' })
  register(
    @Body() body: unknown,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    return pipe(
      Effect.try({
        try: () => registerUserSchema.parse(body),
        catch: (err) => err,
      }),
      Effect.flatMap((input: RegisterUserInput) =>
        this.userService.registerUser(input),
      ),
      Effect.catchAll((err) => Effect.fail(err)),
      Effect.runPromise,
    );
  }

  @Get('me')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Current user', schema: userSchema })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getMe(@Req() req: AuthenticatedRequest): Promise<User> {
    return pipe(
      this.requireAuthUser(req),
      Effect.flatMap((userId) => this.userService.getUserById(userId)),
      Effect.catchAll((err) => Effect.fail(toUnauthorizedException(err))),
      Effect.runPromise,
    );
  }

  @Put('me')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ description: 'User update payload', schema: updateRequestSchema })
  @ApiOkResponse({ description: 'Updated user', schema: userSchema })
  @ApiBadRequestResponse({
    description: 'Invalid request',
    schema: errorSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  updateMe(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<User> {
    return pipe(
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
      Effect.catchAll((err) => Effect.fail(toUnauthorizedException(err))),
      Effect.runPromise,
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
