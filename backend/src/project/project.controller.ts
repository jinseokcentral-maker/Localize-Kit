import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiQuery,
  getSchemaPath,
} from '@nestjs/swagger';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { Effect, pipe } from 'effect';
import { Private } from '../auth/decorators/auth-access.decorator';
import type { JwtPayload } from '../auth/guards/jwt-auth.guard';
import { toUnauthorizedException } from '../common/errors/unauthorized-error';
import {
  runEffectWithErrorHandling,
  unwrapFiberFailure,
} from '../common/effect/effect.util';
import {
  ResponseEnvelopeDto,
  type ResponseEnvelope,
} from '../common/response/response.schema';
import { buildResponse } from '../common/response/response.util';
import { ProjectService } from './project.service';
import {
  addMemberSchema,
  createProjectSchema,
  listProjectsSchema,
  updateProjectSchema,
} from './project.schemas';
import type {
  AddMemberInput,
  CreateProjectInput,
  ListProjectsInput,
  ListProjectsOutput,
  UpdateProjectInput,
} from './project.schemas';
import type { Project } from './project.types';
import {
  ForbiddenProjectAccessError,
  ProjectArchivedError,
  ProjectConflictError,
  ProjectValidationError,
} from './errors/project.errors';
import {
  AddMemberDto,
  CreateProjectDto,
  ProjectDto,
  ListProjectsResponseDto,
  UpdateProjectDto,
} from './project.schemas';
import { ZodError } from 'zod';
import type { PlanName } from './plan/plan.util';

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
@ApiExtraModels(
  CreateProjectDto,
  UpdateProjectDto,
  AddMemberDto,
  ProjectDto,
  ListProjectsResponseDto,
  ResponseEnvelopeDto,
)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create project' })
  @ApiOkResponse({
    description: 'Created project',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseEnvelopeDto) },
        { properties: { data: { $ref: getSchemaPath(ProjectDto) } } },
      ],
    },
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
  @ApiForbiddenResponse({
    description: 'Plan limit exceeded',
    schema: errorSchema,
  })
  createProject(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<ResponseEnvelope<Project>> {
    return runEffectWithErrorHandling(
      pipe(
        Effect.all({
          userId: this.requireUserId(req),
          plan: this.resolvePlan(req),
          input: Effect.try({
            try: () => createProjectSchema.parse(body),
            catch: (err) => err,
          }),
        }),
        Effect.flatMap(({ userId, plan, input }) =>
          this.projectService.createProject(
            userId,
            input as CreateProjectInput,
            plan,
          ),
        ),
        Effect.map((project) => buildResponse(project)),
      ),
      mapControllerError,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List my projects' })
  @ApiOkResponse({
    description: 'Projects list',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseEnvelopeDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ListProjectsResponseDto) },
          },
        },
      ],
    },
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    schema: { type: 'integer', minimum: 1, default: 15 },
    description: 'Number of projects per page',
  })
  @ApiQuery({
    name: 'index',
    required: false,
    schema: { type: 'integer', minimum: 0, default: 0 },
    description: 'Zero-based page index',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    schema: { type: 'string' },
    description: 'Search term to filter projects by name or description',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    schema: { type: 'string', enum: ['active', 'archived'] },
    description: 'Filter by project status (active or archived)',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    schema: { type: 'string', enum: ['newest', 'oldest'], default: 'newest' },
    description: 'Sort order (newest or oldest)',
  })
  listProjects(
    @Req() req: AuthenticatedRequest,
    @Query() query: unknown,
  ): Promise<ResponseEnvelope<ListProjectsOutput>> {
    return runEffectWithErrorHandling(
      pipe(
        Effect.all({
          userId: this.requireUserId(req),
          pagination: Effect.try({
            try: () => listProjectsSchema.parse(query),
            catch: (err) => err,
          }),
        }),
        Effect.flatMap(({ userId, pagination }) =>
          this.projectService.listProjects(
            userId,
            pagination as ListProjectsInput,
          ),
        ),
        Effect.map((projects) => buildResponse(projects)),
      ),
      mapControllerError,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiOkResponse({
    description: 'Updated project',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseEnvelopeDto) },
        { properties: { data: { $ref: getSchemaPath(ProjectDto) } } },
      ],
    },
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
  ): Promise<ResponseEnvelope<Project>> {
    return runEffectWithErrorHandling(
      pipe(
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
        Effect.map((project) => buildResponse(project)),
      ),
      mapControllerError,
    );
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add project member (owner only)' })
  @ApiOkResponse({
    description: 'Member added',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseEnvelopeDto) },
        {
          properties: {
            data: { type: 'null' },
          },
        },
      ],
    },
  })
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
  ): Promise<ResponseEnvelope<null>> {
    return runEffectWithErrorHandling(
      pipe(
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
        Effect.map(() => buildResponse(null)),
      ),
      mapControllerError,
    );
  }

  @Post(':id/members/remove')
  @ApiOperation({ summary: 'Remove project member (owner only)' })
  @ApiOkResponse({
    description: 'Member removed',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseEnvelopeDto) },
        {
          properties: {
            data: { type: 'null' },
          },
        },
      ],
    },
  })
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
  ): Promise<ResponseEnvelope<null>> {
    return runEffectWithErrorHandling(
      pipe(
        this.requireUserId(req),
        Effect.flatMap((userId) =>
          this.projectService.removeMember(userId, id, memberId),
        ),
        Effect.map(() => buildResponse(null)),
      ),
      mapControllerError,
    );
  }

  private requireUserId(
    req: AuthenticatedRequest,
  ): Effect.Effect<string, Error> {
    return Effect.fromNullable(req.user?.sub).pipe(
      Effect.orElseFail(() => new Error('Unauthorized')),
    );
  }

  private resolvePlan(
    req: AuthenticatedRequest,
  ): Effect.Effect<PlanName, Error> {
    return Effect.succeed((req.user?.plan as PlanName | undefined) ?? 'free');
  }
}

function mapControllerError(err: unknown): Error {
  const unwrapped = unwrapFiberFailure(err);
  if (unwrapped instanceof ZodError) {
    return new BadRequestException(unwrapped.issues);
  }
  if (unwrapped instanceof ProjectValidationError) {
    return new BadRequestException(unwrapped.reason);
  }
  if (unwrapped instanceof ForbiddenProjectAccessError) {
    const message =
      unwrapped.plan &&
      unwrapped.limit !== undefined &&
      unwrapped.currentCount !== undefined
        ? `Project limit exceeded. Your ${unwrapped.plan} plan allows ${unwrapped.limit} project${unwrapped.limit === 1 ? '' : 's'}, and you currently have ${unwrapped.currentCount}.`
        : 'Forbidden: insufficient project access';
    return new ForbiddenException(message);
  }
  if (unwrapped instanceof ProjectConflictError) {
    return new ConflictException(unwrapped.reason);
  }
  if (unwrapped instanceof ProjectArchivedError) {
    return new ForbiddenException(
      'Project is archived. Only read operations are allowed.',
    );
  }
  if (unwrapped instanceof Error) {
    return unwrapped;
  }
  return toUnauthorizedException(unwrapped);
}
