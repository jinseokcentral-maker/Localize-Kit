import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import { Effect, Either } from 'effect';
import { ProfileEntity } from '../database/entities/profile.entity';
import { ProjectEntity } from '../database/entities/project.entity';
import { TeamEntity } from '../database/entities/team.entity';
import { TeamMembershipEntity } from '../database/entities/team-membership.entity';
import {
  PersonalTeamNotFoundError,
  UserConflictError,
  UserNotFoundError,
} from './errors/user.errors';
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
    find: jest.fn(),
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
    const mockPersonalTeam: TeamEntity = Object.assign(new TeamEntity(), {
      id: 'personal-team-1',
      name: 'Alice',
      owner_id: 'user-1',
      avatar_url: null,
      personal: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    });
    const mockMembership: TeamMembershipEntity = Object.assign(
      new TeamMembershipEntity(),
      {
        id: 'membership-1',
        team_id: 'personal-team-1',
        user_id: 'user-1',
        role: 'owner',
        joined_at: '2024-01-01T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
      },
    );
    const profileWithTeam = Object.assign(new ProfileEntity(), {
      ...mockProfile,
      team_id: 'personal-team-1',
    });

    (em.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(profileWithTeam)
      .mockResolvedValueOnce(profileWithTeam);
    (em.create as jest.Mock)
      .mockReturnValueOnce(mockProfile)
      .mockReturnValueOnce(mockPersonalTeam)
      .mockReturnValueOnce(mockMembership);
    (em.persistAndFlush as jest.Mock).mockResolvedValue(undefined);
    (em.flush as jest.Mock).mockResolvedValue(undefined);
    (em.find as jest.Mock)
      .mockResolvedValueOnce([mockMembership])
      .mockResolvedValueOnce([mockPersonalTeam]);
    (em.count as jest.Mock)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);
    jwtService.sign = jest
      .fn()
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const result = await Effect.runPromise(
      userService.registerUser(registerInput),
    );

    expect(result.user.id).toBe('user-1');
    expect(result.user.teams).toHaveLength(1);
    expect(result.user.teams[0].teamId).toBe('personal-team-1');
    expect(result.user.teams[0].personal).toBe(true);
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(em.create).toHaveBeenCalledTimes(3);
    expect(em.persistAndFlush).toHaveBeenCalledTimes(3);
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

  it('gets user by id with teams (no memberships, has personal team)', async () => {
    const mockPersonalTeam: TeamEntity = Object.assign(new TeamEntity(), {
      id: 'personal-team-1',
      name: 'Alice',
      owner_id: 'user-1',
      avatar_url: null,
      personal: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    });
    const profileWithTeam = Object.assign(new ProfileEntity(), {
      ...mockProfile,
      team_id: 'personal-team-1',
    });

    (em.findOne as jest.Mock)
      .mockResolvedValueOnce(profileWithTeam)
      .mockResolvedValueOnce(profileWithTeam)
      .mockResolvedValueOnce(profileWithTeam)
      .mockResolvedValueOnce(mockPersonalTeam);
    (em.find as jest.Mock).mockResolvedValueOnce([]);
    (em.count as jest.Mock)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    const user = await Effect.runPromise(userService.getUserById('user-1'));

    expect(user.id).toBe('user-1');
    expect(user.teams).toHaveLength(1);
    expect(user.teams[0].teamId).toBe('personal-team-1');
    expect(user.teams[0].teamName).toBe('Alice');
    expect(user.teams[0].memberCount).toBe(1);
    expect(user.teams[0].avatarUrl).toBeNull();
    expect(user.teams[0].personal).toBe(true);
  });

  it('gets user by id with teams (with memberships)', async () => {
    const mockTeam: TeamEntity = Object.assign(new TeamEntity(), {
      id: 'team-1',
      name: 'My Team',
      owner_id: 'user-1',
      avatar_url: 'https://example.com/team-avatar.png',
      personal: false,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    });
    const mockMembership: TeamMembershipEntity = Object.assign(
      new TeamMembershipEntity(),
      {
        id: 'membership-1',
        team_id: 'team-1',
        user_id: 'user-1',
        role: 'owner',
        joined_at: '2024-01-01T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
      },
    );

    (em.findOne as jest.Mock)
      .mockResolvedValueOnce(mockProfile)
      .mockResolvedValueOnce(mockProfile);
    (em.find as jest.Mock)
      .mockResolvedValueOnce([mockMembership])
      .mockResolvedValueOnce([mockTeam]);
    (em.count as jest.Mock)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3);

    const user = await Effect.runPromise(userService.getUserById('user-1'));

    expect(user.id).toBe('user-1');
    expect(user.teams).toHaveLength(1);
    expect(user.teams[0].teamId).toBe('team-1');
    expect(user.teams[0].teamName).toBe('My Team');
    expect(user.teams[0].memberCount).toBe(3);
    expect(user.teams[0].avatarUrl).toBe('https://example.com/team-avatar.png');
    expect(user.teams[0].projectCount).toBe(5);
    expect(user.teams[0].personal).toBe(false);
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
    const mockPersonalTeam: TeamEntity = Object.assign(new TeamEntity(), {
      id: 'personal-team-1',
      name: 'Alice',
      owner_id: 'user-1',
      avatar_url: null,
      personal: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    });
    const profileWithTeam = Object.assign(new ProfileEntity(), {
      ...mockProfile,
      team_id: 'personal-team-1',
    });
    const updatedProfile = Object.assign(new ProfileEntity(), {
      ...profileWithTeam,
      full_name: 'Alice Updated',
    });

    (em.findOne as jest.Mock)
      .mockResolvedValueOnce(profileWithTeam)
      .mockResolvedValueOnce(updatedProfile)
      .mockResolvedValueOnce(updatedProfile)
      .mockResolvedValueOnce(mockPersonalTeam);
    (em.flush as jest.Mock).mockResolvedValue(undefined);
    (em.find as jest.Mock).mockResolvedValueOnce([]);
    (em.count as jest.Mock)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    const user = await Effect.runPromise(
      userService.updateUser('user-1', updateInput),
    );

    expect(user.fullName).toBe('Alice Updated');
  });
});
