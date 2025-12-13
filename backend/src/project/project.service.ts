import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Effect, pipe } from 'effect';
import { randomUUID } from 'crypto';
import type {
  AddMemberInput,
  CreateProjectInput,
  ListProjectsInput,
  ListProjectsOutput,
  UpdateProjectInput,
} from './project.schemas';
import {
  ProjectConflictError,
  ProjectNotFoundError,
  ForbiddenProjectAccessError,
  ProjectValidationError,
} from './errors/project.errors';
import { ProjectEntity } from '../database/entities/project.entity';
import { TeamMemberEntity } from '../database/entities/team-member.entity';
import type { Project, ProjectRow, TeamMemberRow } from './project.types';
import { canCreateProject, type PlanName } from './plan/plan.util';

const PROJECT_CONFLICT_CODE = '23505';
const DEFAULT_LANGUAGE = 'en';
const SLUG_REGEX = /^[a-z0-9-]+$/;

@Injectable()
export class ProjectService {
  constructor(private readonly em: EntityManager) {}

  createProject(
    userId: string,
    input: CreateProjectInput,
    plan: PlanName = 'free',
  ): Effect.Effect<
    Project,
    ProjectConflictError | ForbiddenProjectAccessError | ProjectValidationError
  > {
    return Effect.tryPromise({
      try: async () => {
        const slug = this.normalizeSlug(input.slug ?? input.name);
        this.validateSlug(slug);

        const currentCount = await this.countProjects(userId);
        if (!canCreateProject(plan, currentCount)) {
          const limit = plan === 'free' ? 1 : plan === 'pro' ? 10 : Infinity;
          throw new ForbiddenProjectAccessError({
            plan,
            currentCount,
            limit,
          });
        }

        const defaultLanguage = input.defaultLanguage ?? DEFAULT_LANGUAGE;
        const languages = input.languages ?? [defaultLanguage];
        const now = new Date().toISOString();

        const project = this.em.create(ProjectEntity, {
          id: randomUUID(),
          name: input.name,
          description: input.description ?? null,
          languages: languages as string[],
          default_language: defaultLanguage,
          slug,
          owner_id: userId,
          created_at: now,
          updated_at: now,
        });

        await this.em.persistAndFlush(project);

        const member = this.em.create(TeamMemberEntity, {
          id: randomUUID(),
          project_id: project.id,
          user_id: userId,
          role: 'owner',
          joined_at: now,
          invited_by: userId,
          invited_at: now,
          created_at: now,
        });

        await this.em.persistAndFlush(member);
        return mapProject(project);
      },
      catch: (err) => {
        if (err instanceof ForbiddenProjectAccessError) {
          return err;
        }
        if (err instanceof ProjectValidationError) {
          return err;
        }
        if (
          err instanceof Error &&
          (err.message.includes('duplicate') ||
            err.message.includes('unique') ||
            err.message.includes('23505') ||
            err.message.includes('already exists'))
        ) {
          return new ProjectConflictError({
            reason: 'Slug already exists',
          });
        }
        return new ProjectConflictError({
          reason: err instanceof Error ? err.message : 'Conflict',
        });
      },
    });
  }

  listProjects(
    userId: string,
    pagination: ListProjectsInput,
  ): Effect.Effect<ListProjectsOutput, never> {
    const { pageSize, index } = pagination;
    return Effect.tryPromise(async () => {
      const [memberRows, ownerProjects] = await Promise.all([
        this.em.find(TeamMemberEntity, { user_id: userId }),
        this.em.find(ProjectEntity, { owner_id: userId }),
      ]);

      const memberProjectIds =
        memberRows.length > 0 ? memberRows.map((m) => m.project_id) : [];

      const memberProjects =
        memberProjectIds.length > 0
          ? await this.em.find(ProjectEntity, {
              id: { $in: memberProjectIds },
            })
          : [];

      const ownerProjectIds = new Set(ownerProjects.map((p) => p.id));
      const allProjects = [
        ...ownerProjects,
        ...memberProjects.filter((p) => !ownerProjectIds.has(p.id)),
      ];
      const uniqueProjects = Array.from(
        new Map(allProjects.map((p) => [p.id, p])).values(),
      );

      uniqueProjects.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime(),
      );

      const totalCount = uniqueProjects.length;
      const from = index * pageSize;
      const to = from + pageSize;
      const items = uniqueProjects.slice(from, to);
      const hasNext = to < totalCount;
      const totalPageCount =
        pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

      return {
        items: items.map(mapProject),
        meta: {
          index,
          pageSize,
          hasNext,
          totalCount,
          totalPageCount,
        },
      };
    }).pipe(
      Effect.catchAll(() =>
        Effect.succeed({
          items: [] as Project[],
          meta: {
            index,
            pageSize,
            hasNext: false,
            totalCount: 0,
            totalPageCount: 0,
          },
        }),
      ),
    );
  }

  updateProject(
    userId: string,
    projectId: string,
    input: UpdateProjectInput,
  ): Effect.Effect<
    Project,
    ProjectNotFoundError | ForbiddenProjectAccessError
  > {
    return pipe(
      this.ensureOwner(userId, projectId),
      Effect.flatMap(() => this.performProjectUpdate(projectId, input)),
    );
  }

  addMember(
    userId: string,
    projectId: string,
    input: AddMemberInput,
  ): Effect.Effect<
    TeamMemberRow,
    ProjectNotFoundError | ForbiddenProjectAccessError
  > {
    return pipe(
      this.ensureOwner(userId, projectId),
      Effect.flatMap(() =>
        Effect.tryPromise({
          try: async () => {
            const member = this.em.create(TeamMemberEntity, {
              id: randomUUID(),
              project_id: projectId,
              user_id: input.userId,
              role: input.role,
              created_at: new Date().toISOString(),
            });
            await this.em.persistAndFlush(member);
            return {
              id: member.id,
              project_id: member.project_id,
              user_id: member.user_id,
              role: member.role,
              invited_at: member.invited_at,
              joined_at: member.joined_at,
              invited_by: member.invited_by,
              created_at: member.created_at,
            } as TeamMemberRow;
          },
          catch: () => new ProjectNotFoundError(),
        }),
      ),
    );
  }

  removeMember(
    userId: string,
    projectId: string,
    memberId: string,
  ): Effect.Effect<void, ProjectNotFoundError | ForbiddenProjectAccessError> {
    return pipe(
      this.ensureOwner(userId, projectId),
      Effect.flatMap(() =>
        Effect.tryPromise({
          try: async () => {
            const member = await this.em.findOne(TeamMemberEntity, {
              project_id: projectId,
              user_id: memberId,
            });
            if (member === null) {
              throw new Error('Member not found');
            }
            await this.em.removeAndFlush(member);
          },
          catch: () => new ProjectNotFoundError(),
        }),
      ),
    );
  }

  private ensureOwner(
    userId: string,
    projectId: string,
  ): Effect.Effect<
    ProjectEntity,
    ProjectNotFoundError | ForbiddenProjectAccessError
  > {
    return Effect.tryPromise({
      try: async () => {
        const project = await this.em.findOne(ProjectEntity, { id: projectId });
        if (project === null) {
          throw new ProjectNotFoundError();
        }
        if (project.owner_id !== userId) {
          throw new ForbiddenProjectAccessError({
            plan: 'unknown',
            currentCount: 0,
            limit: 0,
          });
        }
        return project;
      },
      catch: (err) => {
        if (err instanceof ProjectNotFoundError) {
          return err;
        }
        if (err instanceof ForbiddenProjectAccessError) {
          return err;
        }
        return new ProjectNotFoundError();
      },
    });
  }

  private performProjectUpdate(
    projectId: string,
    input: UpdateProjectInput,
  ): Effect.Effect<Project, ProjectNotFoundError> {
    return Effect.tryPromise({
      try: async () => {
        const project = await this.em.findOne(ProjectEntity, { id: projectId });
        if (project === null) {
          throw new ProjectNotFoundError();
        }
        if (input.name !== undefined) {
          project.name = input.name;
        }
        if (input.description !== undefined) {
          project.description = input.description;
        }
        if (input.languages !== undefined) {
          project.languages = input.languages;
        }
        if (input.defaultLanguage !== undefined) {
          project.default_language = input.defaultLanguage;
        }
        if (input.slug !== undefined) {
          const slug = this.normalizeSlug(input.slug);
          this.validateSlug(slug);
          project.slug = slug;
        }
        project.updated_at = new Date().toISOString();
        await this.em.flush();
        return mapProject(project);
      },
      catch: () => new ProjectNotFoundError(),
    });
  }

  private normalizeSlug(raw: string): string {
    const trimmed = raw.trim().toLowerCase();
    return trimmed
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private validateSlug(slug: string): void {
    if (!SLUG_REGEX.test(slug) || slug.length === 0) {
      throw new ProjectValidationError({
        reason: 'Slug must match ^[a-z0-9-]+$',
      });
    }
  }

  private async countProjects(userId: string): Promise<number> {
    const count = await this.em.count(ProjectEntity, { owner_id: userId });
    return count;
  }
}

function mapProject(row: ProjectRow | ProjectEntity): Project {
  const projectRow =
    row instanceof ProjectEntity
      ? {
          id: row.id,
          name: row.name,
          description: row.description,
          languages: row.languages,
          default_language: row.default_language,
          slug: row.slug,
          owner_id: row.owner_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }
      : row;
  return {
    id: projectRow.id,
    name: projectRow.name,
    description: projectRow.description,
    languages: projectRow.languages,
    defaultLanguage: projectRow.default_language,
    slug: projectRow.slug,
    ownerId: projectRow.owner_id,
    createdAt: projectRow.created_at,
    updatedAt: projectRow.updated_at,
  };
}
