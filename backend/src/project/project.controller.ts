import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBadRequestResponse,
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
import { Private } from '../auth/decorators/auth-access.decorator';
import type { JwtPayload } from '../auth/guards/jwt-auth.guard';
import { toUnauthorizedException } from '../common/errors/unauthorized-error';
import { ProjectService } from './project.service';
import {
  addMemberSchema,
  createProjectSchema,
  updateProjectSchema,
} from './project.schemas';
import type {
  AddMemberInput,
  CreateProjectInput,
  UpdateProjectInput,
} from './project.schemas';
import type { Project } from './project.types';
import {
  AddMemberDto,
  CreateProjectDto,
  ProjectDto,
  UpdateProjectDto,
} from './project.schemas';
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

const addMemberRequestSchema: SchemaObject = {
  type: 'object',
  properties: {
    userId: { type: 'string', format: 'uuid' },
    role: { type: 'string', enum: ['owner', 'editor', 'viewer'] },
  },
  required: ['userId', 'role'],
};

const removeMemberRequestSchema: SchemaObject = {
  type: 'object',
  properties: {
    userId: { type: 'string', format: 'uuid' },
  },
  required: ['userId'],
};

function oneOfString(format?: string): SchemaObject {
  return {
    oneOf: [
      { type: 'string', ...(format !== undefined ? { format } : {}) },
      { type: 'null' },
    ],
  };
}

@ApiTags('projects')
@ApiBearerAuth('jwt')
@Private()
@ApiExtraModels(CreateProjectDto, UpdateProjectDto, AddMemberDto, ProjectDto)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create project' })
  @ApiOkResponse({
    description: 'Created project',
    schema: { $ref: getSchemaPath(ProjectDto) },
  })
  @ApiBody({
    description: 'Project creation payload',
    schema: { $ref: getSchemaPath(CreateProjectDto) },
  })
  @ApiBadRequestResponse({
    description: 'Invalid payload',
    schema: errorSchema,
  })
  @ApiConflictResponse({ description: 'Slug conflict', schema: errorSchema })
  createProject(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<Project> {
    return pipe(
      this.requireUserId(req),
      Effect.flatMap((userId) =>
        Effect.try({
          try: () => createProjectSchema.parse(body),
          catch: (err) => err,
        }).pipe(
          Effect.flatMap((input: CreateProjectInput) =>
            this.projectService.createProject(userId, input),
          ),
        ),
      ),
      Effect.catchAll((err) => Effect.fail(mapControllerError(err))),
      Effect.runPromise,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List my projects' })
  @ApiOkResponse({
    description: 'Projects list',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(ProjectDto) },
    },
  })
  listProjects(@Req() req: AuthenticatedRequest): Promise<Project[]> {
    return pipe(
      this.requireUserId(req),
      Effect.flatMap((userId) => this.projectService.listProjects(userId)),
      Effect.catchAll((err) => Effect.fail(mapControllerError(err))),
      Effect.runPromise,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiOkResponse({
    description: 'Updated project',
    schema: { $ref: getSchemaPath(ProjectDto) },
  })
  @ApiBody({
    description: 'Project update payload',
    schema: { $ref: getSchemaPath(UpdateProjectDto) },
  })
  @ApiBadRequestResponse({
    description: 'Invalid payload',
    schema: errorSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', schema: errorSchema })
  updateProject(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<Project> {
    return pipe(
      Effect.all({
        userId: this.requireUserId(req),
        input: Effect.try({
          try: () => updateProjectSchema.parse(body),
          catch: (err) => err,
        }),
      }),
      Effect.flatMap(({ userId, input }) =>
        this.projectService.updateProject(
          userId,
          id,
          input as UpdateProjectInput,
        ),
      ),
      Effect.catchAll((err) => Effect.fail(mapControllerError(err))),
      Effect.runPromise,
    );
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add project member (owner only)' })
  @ApiOkResponse({ description: 'Member added' })
  @ApiBody({
    description: 'Add member payload',
    schema: { $ref: getSchemaPath(AddMemberDto) },
  })
  @ApiBadRequestResponse({
    description: 'Invalid payload',
    schema: errorSchema,
  })
  addMember(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<void> {
    return pipe(
      Effect.all({
        userId: this.requireUserId(req),
        input: Effect.try({
          try: () => addMemberSchema.parse(body),
          catch: (err) => err,
        }),
      }),
      Effect.flatMap(({ userId, input }) =>
        this.projectService.addMember(userId, id, input as AddMemberInput),
      ),
      Effect.as(void 0),
      Effect.catchAll((err) => Effect.fail(mapControllerError(err))),
      Effect.runPromise,
    );
  }

  @Post(':id/members/remove')
  @ApiOperation({ summary: 'Remove project member (owner only)' })
  @ApiOkResponse({ description: 'Member removed' })
  @ApiBody({
    description: 'Remove member payload',
    schema: removeMemberRequestSchema,
  })
  @ApiBadRequestResponse({
    description: 'Invalid payload',
    schema: errorSchema,
  })
  removeMember(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('userId') memberId: string,
  ): Promise<void> {
    return pipe(
      this.requireUserId(req),
      Effect.flatMap((userId) =>
        this.projectService.removeMember(userId, id, memberId),
      ),
      Effect.catchAll((err) => Effect.fail(mapControllerError(err))),
      Effect.runPromise,
    );
  }

  private requireUserId(
    req: AuthenticatedRequest,
  ): Effect.Effect<string, Error> {
    return Effect.fromNullable(req.user?.sub).pipe(
      Effect.orElseFail(() => new Error('Unauthorized')),
    );
  }
}

function mapControllerError(err: unknown): Error {
  if (err instanceof ZodError) {
    return new BadRequestException(err.issues);
  }
  if (err instanceof Error) {
    return err;
  }
  return toUnauthorizedException(err);
}
