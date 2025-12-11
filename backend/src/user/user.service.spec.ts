import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Effect } from 'effect';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Either } from 'effect';
import { SupabaseService } from '../supabase/supabase.service';
import type { Database } from '../type/supabse';
import { UserConflictError, UserNotFoundError } from './errors/user.errors';
import { UserService } from './user.service';
import type { RegisterUserInput, UpdateUserInput } from './user.schemas';
import type { UserProfileRow } from './user.types';

const mockProfileRow: UserProfileRow = {
  id: 'user-1',
  email: 'a@b.com',
  full_name: 'Alice',
  avatar_url: null,
  plan: 'pro',
  stripe_customer_id: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const registerInput: RegisterUserInput = {
  id: 'user-1',
  email: 'a@b.com',
  fullName: 'Alice',
  avatarUrl: undefined,
  plan: 'pro',
};

const updateInput: UpdateUserInput = {
  fullName: 'Alice Updated',
  avatarUrl: 'https://example.com/avatar.png',
  plan: 'enterprise',
};

describe('UserService', () => {
  let userService: UserService;
  const supabaseService = {
    getClient: jest.fn(),
  } as unknown as SupabaseService;
  const jwtService = {
    sign: jest.fn().mockReturnValue('access'),
  } as unknown as JwtService;
  const configService = {
    get: jest.fn(),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.resetAllMocks();
    supabaseService.getClient = jest.fn();
    (configService.get as jest.Mock).mockReturnValue('7d');
    userService = new UserService(configService, supabaseService, jwtService);
  });

  it('registers a user and returns tokens', async () => {
    supabaseService.getClient = jest.fn(
      () =>
        ({
          from: jest.fn(() => ({
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: mockProfileRow, error: null }),
              })),
            })),
          })),
        }) as unknown as SupabaseClient<Database>,
    );
    jwtService.sign = jest
      .fn()
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const result = await Effect.runPromise(
      userService.registerUser(registerInput),
    );

    expect(result.user.id).toBe('user-1');
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
  });

  it('fails to register on conflict', async () => {
    supabaseService.getClient = jest.fn(
      () =>
        ({
          from: jest.fn(() => ({
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: '23505', message: 'conflict' },
                }),
              })),
            })),
          })),
        }) as unknown as SupabaseClient<Database>,
    );

    const result = await Effect.runPromise(
      Effect.either(userService.registerUser(registerInput)),
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(UserConflictError);
    }
  });

  it('gets user by id', async () => {
    supabaseService.getClient = jest.fn(
      () =>
        ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: mockProfileRow, error: null }),
              })),
            })),
          })),
        }) as unknown as SupabaseClient<Database>,
    );

    const user = await Effect.runPromise(userService.getUserById('user-1'));

    expect(user.id).toBe('user-1');
  });

  it('fails when user not found', async () => {
    supabaseService.getClient = jest.fn(
      () =>
        ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'not found' },
                }),
              })),
            })),
          })),
        }) as unknown as SupabaseClient<Database>,
    );

    const result = await Effect.runPromise(
      Effect.either(userService.getUserById('missing')),
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(UserNotFoundError);
    }
  });

  it('updates user profile', async () => {
    supabaseService.getClient = jest.fn(
      () =>
        ({
          from: jest.fn(() => ({
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: { ...mockProfileRow, full_name: 'New' },
                    error: null,
                  }),
                })),
              })),
            })),
          })),
        }) as unknown as SupabaseClient<Database>,
    );

    const user = await Effect.runPromise(
      userService.updateUser('user-1', updateInput),
    );

    expect(user.fullName).toBe('New');
  });
});
