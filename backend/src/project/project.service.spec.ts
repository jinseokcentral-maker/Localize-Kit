import type { SupabaseClient } from '@supabase/supabase-js';
import { Effect, Either } from 'effect';
import { SupabaseService } from '../supabase/supabase.service';
import type { Database } from '../type/supabse';
import {
  ProjectConflictError,
  ProjectNotFoundError,
  ForbiddenProjectAccessError,
} from './errors/project.errors';
import { ProjectService } from './project.service';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  AddMemberInput,
} from './project.schemas';
import type { ProjectRow, TeamMemberRow } from './project.types';

const projectRow: ProjectRow = {
  id: 'proj-1',
  name: 'Proj',
  description: 'desc',
  languages: ['en'],
  default_language: 'en',
  slug: 'proj',
  owner_id: 'user-1',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const ownerMemberRow: TeamMemberRow = {
  id: 'member-1',
  user_id: 'user-1',
  project_id: 'proj-1',
  role: 'owner',
  created_at: '2024-01-01T00:00:00.000Z',
  invited_at: null,
  invited_by: null,
  joined_at: null,
};

const memberRow: TeamMemberRow = {
  id: 'member-2',
  user_id: 'user-2',
  project_id: 'proj-1',
  role: 'editor',
  created_at: '2024-01-01T00:00:00.000Z',
  invited_at: null,
  invited_by: null,
  joined_at: null,
};

describe('ProjectService', () => {
  let service: ProjectService;
  const supabaseService = {
    getClient: jest.fn(),
  } as unknown as SupabaseService;

  beforeEach(() => {
    jest.resetAllMocks();
    supabaseService.getClient = jest.fn();
    service = new ProjectService(supabaseService);
  });

  it('creates project', async () => {
    const countSelect = jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ count: 0, error: null })),
    }));
    const insertProject = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({ data: projectRow, error: null }),
      })),
    }));
    const insertMember = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest
          .fn()
          .mockResolvedValue({ data: ownerMemberRow, error: null }),
      })),
    }));
    supabaseService.getClient = jest.fn(
      () =>
        ({
          from: jest.fn((table: string) => {
            if (table === 'projects') {
              return {
                select: countSelect,
                insert: insertProject,
              };
            }
            if (table === 'team_members') {
              return {
                insert: insertMember,
              };
            }
            return {};
          }),
        }) as unknown as SupabaseClient<Database>,
    );

    const input: CreateProjectInput = { name: 'Proj', slug: 'proj' };
    const result = await Effect.runPromise(
      service.createProject('user-1', input),
    );

    expect(result.name).toBe('Proj');
  });

  it('fails create on conflict', async () => {
    const countSelect = jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ count: 0, error: null })),
    }));
    const insertProject = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'conflict' },
        }),
      })),
    }));
    supabaseService.getClient = jest.fn(
      () =>
        ({
          from: jest.fn((table: string) => {
            if (table === 'projects') {
              return {
                select: countSelect,
                insert: insertProject,
              };
            }
            return {
              insert: jest.fn(),
            };
          }),
        }) as unknown as SupabaseClient<Database>,
    );

    const result = await Effect.runPromise(
      Effect.either(service.createProject('user-1', { name: 'Proj' })),
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(ProjectConflictError);
    }
  });

  it('lists projects (owner and member)', async () => {
    supabaseService.getClient = jest.fn(
      () =>
        ({
          from: jest.fn((table: string) => {
            if (table === 'projects') {
              return {
                select: jest.fn(() => ({
                  or: jest.fn(() => ({
                    order: jest.fn(() => ({
                      range: jest.fn(() =>
                        Promise.resolve({
                          data: [{ ...projectRow, count: 1 }],
                          error: null,
                        }),
                      ),
                    })),
                  })),
                })),
              };
            }
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  data: [{ project_id: 'proj-1' }],
                  error: null,
                })),
              })),
            };
          }),
        }) as unknown as SupabaseClient<Database>,
    );

    const projects = await Effect.runPromise(
      service.listProjects('user-1', { pageSize: 10, index: 0 }),
    );
    expect(projects.items.length).toBeGreaterThan(0);
    expect(projects.meta.hasNext).toBe(false);
    expect(projects.meta.totalCount).toBe(1);
    expect(projects.meta.totalPageCount).toBe(1);
  });

  it('updates project', async () => {
    supabaseService.getClient = jest.fn(
      () =>
        ({
          from: jest.fn((table: string) => {
            if (table === 'projects') {
              return {
                select: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    single: jest
                      .fn()
                      .mockResolvedValue({ data: projectRow, error: null }),
                  })),
                })),
                update: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    select: jest.fn(() => ({
                      single: jest.fn().mockResolvedValue({
                        data: { ...projectRow, name: 'New' },
                        error: null,
                      }),
                    })),
                  })),
                })),
              };
            }
            return { select: jest.fn() };
          }),
        }) as unknown as SupabaseClient<Database>,
    );

    const update: UpdateProjectInput = { name: 'New' };
    const project = await Effect.runPromise(
      service.updateProject('user-1', 'proj-1', update),
    );
    expect(project.name).toBe('New');
  });

  it('prevents update by non-owner', async () => {
    supabaseService.getClient = jest.fn(
      () =>
        ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { ...projectRow, owner_id: 'other' },
                  error: null,
                }),
              })),
            })),
          })),
        }) as unknown as SupabaseClient<Database>,
    );

    const result = await Effect.runPromise(
      Effect.either(service.updateProject('user-1', 'proj-1', { name: 'X' })),
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(ForbiddenProjectAccessError);
    }
  });

  it('adds member when owner', async () => {
    supabaseService.getClient = jest.fn(
      () =>
        ({
          from: jest.fn((table: string) => {
            if (table === 'projects') {
              return {
                select: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    single: jest
                      .fn()
                      .mockResolvedValue({ data: projectRow, error: null }),
                  })),
                })),
              };
            }
            return {
              insert: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest
                    .fn()
                    .mockResolvedValue({ data: memberRow, error: null }),
                })),
              })),
            };
          }),
        }) as unknown as SupabaseClient<Database>,
    );

    const input: AddMemberInput = { userId: 'user-2', role: 'editor' };
    const member = await Effect.runPromise(
      service.addMember('user-1', 'proj-1', input),
    );
    expect(member.user_id).toBe('user-2');
  });

  it('removes member when owner', async () => {
    supabaseService.getClient = jest.fn(
      () =>
        ({
          from: jest.fn((table: string) => {
            if (table === 'projects') {
              return {
                select: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    single: jest
                      .fn()
                      .mockResolvedValue({ data: projectRow, error: null }),
                  })),
                })),
              };
            }
            return {
              delete: jest.fn(() => ({
                eq: jest.fn(() => ({
                  eq: jest.fn(() => ({ error: null })),
                })),
              })),
            };
          }),
        }) as unknown as SupabaseClient<Database>,
    );

    await expect(
      Effect.runPromise(service.removeMember('user-1', 'proj-1', 'user-2')),
    ).resolves.toBeUndefined();
  });
});
