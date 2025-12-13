import { Injectable } from '@nestjs/common';
import { Effect, pipe } from 'effect';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import type { Database } from '../type/supabse';
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
import type { Project, ProjectRow, TeamMemberRow } from './project.types';
import { canCreateProject, type PlanName } from './plan/plan.util';

const PROJECT_CONFLICT_CODE = '23505';
const DEFAULT_LANGUAGE = 'en';
const SLUG_REGEX = /^[a-z0-9-]+$/;

@Injectable()
export class ProjectService {
  constructor(private readonly supabaseService: SupabaseService) {}

  createProject(
    userId: string,
    input: CreateProjectInput,
    plan: PlanName = 'free',
  ): Effect.Effect<
    Project,
    ProjectConflictError | ForbiddenProjectAccessError | ProjectValidationError
  > {
    const client = this.getClient();
    return Effect.tryPromise({
      try: async () => {
        const slug = this.normalizeSlug(input.slug ?? input.name);
        this.validateSlug(slug);

        const currentCount = await this.countProjects(client, userId);
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

        const { data, error } = await client
          .from('projects')
          .insert({
            name: input.name,
            description: input.description ?? null,
            languages,
            default_language: defaultLanguage,
            slug,
            owner_id: userId,
          })
          .select('*')
          .single<ProjectRow>();
        if (error !== null) {
          const isConflict =
            error.code === PROJECT_CONFLICT_CODE ||
            error.message?.toLowerCase().includes('duplicate') ||
            error.message?.toLowerCase().includes('unique') ||
            error.message?.toLowerCase().includes('already exists');
          if (isConflict) {
            throw new ProjectConflictError({
              reason: 'Slug already exists',
            });
          }
          throw new ProjectConflictError({ reason: error.message });
        }

        const memberInsert = await client
          .from('team_members')
          .insert({
            project_id: data.id,
            user_id: userId,
            role: 'owner',
            joined_at: new Date().toISOString(),
            invited_by: userId,
            invited_at: new Date().toISOString(),
          })
          .select('*')
          .single<TeamMemberRow>();

        if (memberInsert.error !== null) {
          throw new ProjectConflictError({
            reason: memberInsert.error.message,
          });
        }

        return mapProject(data);
      },
      catch: (err) =>
        err instanceof ProjectConflictError
          ? err
          : err instanceof ForbiddenProjectAccessError
            ? err
            : err instanceof ProjectValidationError
              ? err
              : new ProjectConflictError({
                  reason: err instanceof Error ? err.message : 'Conflict',
                }),
    });
  }

  listProjects(
    userId: string,
    pagination: ListProjectsInput,
  ): Effect.Effect<ListProjectsOutput, never> {
    const client = this.getClient();
    const { pageSize, index } = pagination;
    const from = index * pageSize;
    const to = from + pageSize - 1;
    return Effect.tryPromise(async () => {
      const { data: memberRows, error: memberError } = await client
        .from('team_members')
        .select('project_id')
        .eq('user_id', userId);
      if (memberError !== null) {
        throw memberError;
      }

      const memberProjectIds =
        memberRows?.map((row) => row.project_id).filter(Boolean) ?? [];

      const filters = [`owner_id.eq.${userId}`];
      if (memberProjectIds.length > 0) {
        filters.push(`id.in.(${memberProjectIds.join(',')})`);
      }

      const { data, error, count } = await client
        .from('projects')
        .select('*', { count: 'exact' })
        .or(filters.join(','))
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error !== null || data === null) {
        throw error ?? new Error('Failed to list projects');
      }

      const totalCount = count ?? 0;

      const hasNext = (index + 1) * pageSize < totalCount;
      const items = data;
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
    const client = this.getClient();
    return pipe(
      this.ensureOwner(userId, projectId),
      Effect.flatMap(() =>
        Effect.tryPromise({
          try: async () => {
            const { data, error } = await client
              .from('team_members')
              .insert({
                project_id: projectId,
                user_id: input.userId,
                role: input.role,
              })
              .select('*')
              .single<TeamMemberRow>();
            if (error !== null || data === null) {
              throw new Error(error?.message ?? 'Failed to add member');
            }
            return data;
          },
          catch: (err) => new ProjectNotFoundError(),
        }),
      ),
    );
  }

  removeMember(
    userId: string,
    projectId: string,
    memberId: string,
  ): Effect.Effect<void, ProjectNotFoundError | ForbiddenProjectAccessError> {
    const client = this.getClient();
    return pipe(
      this.ensureOwner(userId, projectId),
      Effect.flatMap(() =>
        Effect.tryPromise({
          try: async () => {
            const { error } = await client
              .from('team_members')
              .delete()
              .eq('project_id', projectId)
              .eq('user_id', memberId);
            if (error !== null) {
              throw new Error(error.message);
            }
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
    ProjectRow,
    ProjectNotFoundError | ForbiddenProjectAccessError
  > {
    const client = this.getClient();
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await client
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single<ProjectRow>();
        if (error !== null || data === null) {
          throw new ProjectNotFoundError();
        }
        if (data.owner_id !== userId) {
          throw new ForbiddenProjectAccessError({
            plan: 'unknown',
            currentCount: 0,
            limit: 0,
          });
        }
        return data;
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
    const client = this.getClient();
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await client
          .from('projects')
          .update({
            name: input.name,
            description: input.description,
            languages: input.languages,
            default_language: input.defaultLanguage,
            slug: input.slug,
          })
          .eq('id', projectId)
          .select('*')
          .single<ProjectRow>();
        if (error !== null || data === null) {
          throw new ProjectNotFoundError();
        }
        return mapProject(data);
      },
      catch: () => new ProjectNotFoundError(),
    });
  }

  private getClient(): SupabaseClient<Database> {
    return this.supabaseService.getClient();
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

  private async countProjects(
    client: SupabaseClient<Database>,
    userId: string,
  ): Promise<number> {
    const { count, error } = await client
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId);
    if (error !== null || count === null) {
      return 0;
    }
    return count;
  }
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    languages: row.languages,
    defaultLanguage: row.default_language,
    slug: row.slug,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
