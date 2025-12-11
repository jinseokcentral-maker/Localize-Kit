import { Injectable } from '@nestjs/common';
import { Effect, pipe } from 'effect';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import type { Database } from '../type/supabse';
import type {
  AddMemberInput,
  CreateProjectInput,
  UpdateProjectInput,
} from './project.schemas';
import {
  ProjectConflictError,
  ProjectNotFoundError,
  ForbiddenProjectAccessError,
} from './errors/project.errors';
import type { Project, ProjectRow, TeamMemberRow } from './project.types';
import { canCreateProject, type PlanName } from './plan/plan.util';

const PROJECT_CONFLICT_CODE = '23505';

@Injectable()
export class ProjectService {
  constructor(private readonly supabaseService: SupabaseService) {}

  createProject(
    userId: string,
    input: CreateProjectInput,
    plan: PlanName = 'free',
  ): Effect.Effect<
    Project,
    ProjectConflictError | ForbiddenProjectAccessError
  > {
    const client = this.getClient();
    return Effect.tryPromise({
      try: async () => {
        const currentCount = await this.countProjects(client, userId);
        if (!canCreateProject(plan, currentCount)) {
          throw new ForbiddenProjectAccessError();
        }

        const { data, error } = await client
          .from('projects')
          .insert({
            name: input.name,
            description: input.description ?? null,
            languages: input.languages ?? null,
            default_language: input.defaultLanguage ?? null,
            slug: input.slug ?? input.name,
            owner_id: userId,
          })
          .select('*')
          .single<ProjectRow>();
        if (error !== null) {
          if (error.code === PROJECT_CONFLICT_CODE) {
            throw new ProjectConflictError({ reason: error.message });
          }
          throw new ProjectConflictError({ reason: error.message });
        }
        return mapProject(data);
      },
      catch: (err) =>
        err instanceof ProjectConflictError
          ? err
          : new ProjectConflictError({
              reason: err instanceof Error ? err.message : 'Conflict',
            }),
    });
  }

  listProjects(userId: string): Effect.Effect<Project[], never> {
    const client = this.getClient();
    return Effect.tryPromise(async () => {
      const ownedPromise = client
        .from('projects')
        .select('*')
        .eq('owner_id', userId);
      const memberPromise = client
        .from('team_members')
        .select('project_id')
        .eq('user_id', userId);

      const [owned, member] = await Promise.all([ownedPromise, memberPromise]);

      const memberProjectIds =
        member.data?.map((row) => row.project_id).filter(Boolean) ?? [];

      const memberProjects =
        memberProjectIds.length === 0
          ? { data: [], error: null }
          : await client
              .from('projects')
              .select('*')
              .in('id', memberProjectIds);

      if (owned.error !== null) {
        throw owned.error;
      }
      if (memberProjects.error !== null) {
        throw memberProjects.error;
      }

      const all = [...(owned.data ?? []), ...(memberProjects.data ?? [])];
      return all.map(mapProject);
    }).pipe(Effect.catchAll(() => Effect.succeed([] as Project[])));
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
          throw new ForbiddenProjectAccessError();
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
