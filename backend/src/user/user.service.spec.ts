import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import { Effect, Either } from 'effect';
import { ProfileEntity } from '../database/entities/profile.entity';
import { ProjectEntity } from '../database/entities/project.entity';
import { UserConflictError, UserNotFoundError } from './errors/user.errors';
import { UserService } from './user.service';
import type { RegisterUserInput, UpdateUserInput } from './user.schemas';

const mockProfile: ProfileEntity = Object.assign(new ProfileEntity(), {
  id: 'user-1',
  email: 'a@b.com',
  full_name: 'Alice',
  avatar_url: null,
  plan: 'pro',
  stripe_customer_id: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
});

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
  const em = {
    findOne: jest.fn(),
    create: jest.fn(),
    persistAndFlush: jest.fn(),
    flush: jest.fn(),
    count: jest.fn(),
  } as unknown as EntityManager;
  const jwtService = {
    sign: jest.fn().mockReturnValue('access'),
  } as unknown as JwtService;
  const configService = {
    get: jest.fn(),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.resetAllMocks();
    (configService.get as jest.Mock).mockReturnValue('7d');
    userService = new UserService(configService, jwtService, em);
  });

  it('registers a user and returns tokens', async () => {
    (em.findOne as jest.Mock).mockResolvedValue(null);
    (em.create as jest.Mock).mockReturnValue(mockProfile);
    (em.persistAndFlush as jest.Mock).mockResolvedValue(undefined);
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
    (em.findOne as jest.Mock).mockResolvedValue(null);
    (em.create as jest.Mock).mockReturnValue(mockProfile);
    (em.persistAndFlush as jest.Mock).mockRejectedValue(
      new Error('duplicate key value violates unique constraint'),
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
    (em.findOne as jest.Mock).mockResolvedValue(mockProfile);
    (em.count as jest.Mock).mockResolvedValue(0);

    const user = await Effect.runPromise(userService.getUserById('user-1'));

    expect(user.id).toBe('user-1');
  });

  it('fails when user not found', async () => {
    (em.findOne as jest.Mock).mockResolvedValue(null);

    const result = await Effect.runPromise(
      Effect.either(userService.getUserById('missing')),
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(UserNotFoundError);
    }
  });

  it('updates user profile', async () => {
    const updatedProfile = Object.assign(new ProfileEntity(), {
      ...mockProfile,
      full_name: 'Alice Updated',
    });
    (em.findOne as jest.Mock).mockResolvedValue(mockProfile);
    (em.flush as jest.Mock).mockResolvedValue(undefined);

    const user = await Effect.runPromise(
      userService.updateUser('user-1', updateInput),
    );

    expect(user.fullName).toBe('Alice Updated');
  });
});
