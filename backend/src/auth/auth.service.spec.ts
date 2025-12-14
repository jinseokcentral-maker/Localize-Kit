import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import { Effect, Either } from 'effect';
import { ProfileEntity } from '../database/entities/profile.entity';
import { TeamEntity } from '../database/entities/team.entity';
import { TeamMembershipEntity } from '../database/entities/team-membership.entity';
import { AuthService } from './auth.service';
import {
  InvalidTokenError,
  ProviderAuthError,
  TeamAccessForbiddenError,
} from './errors/auth.errors';
import type { JwtPayload } from './guards/jwt-auth.guard';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

describe('AuthService', () => {
  let authService: AuthService;
  const jwtService = {
    sign: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;
  const configService = {
    get: jest.fn(),
  } as unknown as ConfigService;
  const supabaseClient = {
    auth: {
      getUser: jest.fn(),
    },
  };
  const supabaseService = {
    getClient: jest.fn().mockReturnValue(supabaseClient),
  } as unknown as any;
  const em = {
    findOne: jest.fn(),
    create: jest.fn(),
    persistAndFlush: jest.fn(),
  } as unknown as EntityManager;

  const payload: JwtPayload = {
    sub: 'user-1',
    email: 'a@b.com',
    plan: null,
    teamId: null,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    configService.get = jest.fn().mockReturnValue('7d');
    (supabaseService.getClient as jest.Mock).mockReturnValue(supabaseClient);
    authService = new AuthService(
      configService,
      jwtService,
      supabaseService,
      em,
    );
  });

  it('issues access and refresh tokens', () => {
    jwtService.sign = jest
      .fn()
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const tokens = authService.issueTokens(payload);

    expect(tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(jwtService.sign).toHaveBeenCalledTimes(2);
  });

  it('refreshes tokens when refresh token is valid', async () => {
    jwtService.verifyAsync = jest.fn().mockResolvedValue(payload);
    jwtService.sign = jest
      .fn()
      .mockReturnValueOnce('new-access')
      .mockReturnValueOnce('new-refresh');

    const result = await Effect.runPromise(
      authService.refreshTokens('refresh'),
    );

    expect(result).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('refresh');
  });

  it('fails to refresh tokens when refresh token is invalid', async () => {
    jwtService.verifyAsync = jest
      .fn()
      .mockRejectedValue(new Error('bad token'));

    const result = await Effect.runPromise(
      Effect.either(authService.refreshTokens('refresh')),
    );

    expect(result._tag).toBe('Left');
    // narrow
    if (result._tag === 'Left') {
      expect(result.left).toBeInstanceOf(InvalidTokenError);
    }
  });

  it('switches team successfully when user is a member', async () => {
    const mockProfile: ProfileEntity = Object.assign(new ProfileEntity(), {
      id: 'user-1',
      email: 'a@b.com',
      full_name: 'Alice',
      avatar_url: null,
      plan: 'free',
      stripe_customer_id: null,
      team_id: 'personal-team-1',
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
      .mockResolvedValueOnce(mockMembership)
      .mockResolvedValueOnce(mockProfile);
    jwtService.sign = jest
      .fn()
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const result = await Effect.runPromise(
      authService.switchTeam('user-1', 'team-1'),
    );

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(em.findOne).toHaveBeenCalledWith(TeamMembershipEntity, {
      user_id: 'user-1',
      team_id: 'team-1',
    });
    expect(em.findOne).toHaveBeenCalledWith(ProfileEntity, { id: 'user-1' });
  });

  it('fails to switch team when user is not a member', async () => {
    (em.findOne as jest.Mock).mockResolvedValueOnce(null);

    const result = await Effect.runPromise(
      Effect.either(authService.switchTeam('user-1', 'team-1')),
    );

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBeInstanceOf(TeamAccessForbiddenError);
      if (result.left instanceof TeamAccessForbiddenError) {
        expect(result.left.userId).toBe('user-1');
        expect(result.left.teamId).toBe('team-1');
      }
    }
  });

  it('switches team when profile is not found', async () => {
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
      .mockResolvedValueOnce(mockMembership)
      .mockResolvedValueOnce(null);

    const result = await Effect.runPromise(
      Effect.either(authService.switchTeam('user-1', 'team-1')),
    );

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBeInstanceOf(TeamAccessForbiddenError);
    }
  });

  it('issues tokens with teamId', () => {
    const payloadWithTeam: JwtPayload = {
      ...payload,
      teamId: 'team-1',
    };
    jwtService.sign = jest
      .fn()
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const tokens = authService.issueTokens(payloadWithTeam);

    expect(tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(jwtService.sign).toHaveBeenCalledTimes(2);
  });

  it('logs in with Google access token without teamId (uses personal team)', async () => {
    const mockAuthUser: SupabaseAuthUser = {
      id: 'user-1',
      email: 'a@b.com',
      user_metadata: { name: 'Alice' },
    } as unknown as SupabaseAuthUser;
    const mockProfile: ProfileEntity = Object.assign(new ProfileEntity(), {
      id: 'user-1',
      email: 'a@b.com',
      full_name: 'Alice',
      avatar_url: null,
      plan: 'free',
      stripe_customer_id: null,
      team_id: 'personal-team-1',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    });
    const mockPersonalTeam: TeamEntity = Object.assign(new TeamEntity(), {
      id: 'personal-team-1',
      name: 'Alice',
      owner_id: 'user-1',
      avatar_url: null,
      personal: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    });

    (supabaseClient.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    });
    (em.findOne as jest.Mock)
      .mockResolvedValueOnce(mockProfile) // findOrCreateUser: find existing profile
      .mockResolvedValueOnce(mockProfile) // getPersonalTeamId: find profile
      .mockResolvedValueOnce(mockPersonalTeam); // getPersonalTeamId: find team
    jwtService.sign = jest
      .fn()
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const result = await Effect.runPromise(
      authService.loginWithGoogleAccessToken('google-token'),
    );

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(em.findOne).toHaveBeenCalledWith(ProfileEntity, { id: 'user-1' });
    expect(em.findOne).toHaveBeenCalledWith(TeamEntity, {
      id: 'personal-team-1',
      personal: true,
    });
  });

  it('logs in with Google access token with teamId (verifies membership)', async () => {
    const mockAuthUser: SupabaseAuthUser = {
      id: 'user-1',
      email: 'a@b.com',
      user_metadata: { name: 'Alice' },
    } as unknown as SupabaseAuthUser;
    const mockProfile: ProfileEntity = Object.assign(new ProfileEntity(), {
      id: 'user-1',
      email: 'a@b.com',
      full_name: 'Alice',
      avatar_url: null,
      plan: 'free',
      stripe_customer_id: null,
      team_id: 'personal-team-1',
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

    (supabaseClient.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    });
    (em.findOne as jest.Mock)
      .mockResolvedValueOnce(mockProfile) // findOrCreateUser: find existing profile
      .mockResolvedValueOnce(mockMembership); // verifyTeamMembership: find membership
    jwtService.sign = jest
      .fn()
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const result = await Effect.runPromise(
      authService.loginWithGoogleAccessToken('google-token', 'team-1'),
    );

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(em.findOne).toHaveBeenCalledWith(TeamMembershipEntity, {
      user_id: 'user-1',
      team_id: 'team-1',
    });
  });

  it('fails to login with teamId when user is not a member', async () => {
    const mockAuthUser: SupabaseAuthUser = {
      id: 'user-1',
      email: 'a@b.com',
      user_metadata: { name: 'Alice' },
    } as unknown as SupabaseAuthUser;
    const mockProfile: ProfileEntity = Object.assign(new ProfileEntity(), {
      id: 'user-1',
      email: 'a@b.com',
      full_name: 'Alice',
      avatar_url: null,
      plan: 'free',
      stripe_customer_id: null,
      team_id: 'personal-team-1',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    });

    (supabaseClient.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    });
    (em.findOne as jest.Mock)
      .mockResolvedValueOnce(mockProfile) // findOrCreateUser: find existing profile
      .mockResolvedValueOnce(null); // verifyTeamMembership: membership not found

    const result = await Effect.runPromise(
      Effect.either(
        authService.loginWithGoogleAccessToken('google-token', 'team-1'),
      ),
    );

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBeInstanceOf(TeamAccessForbiddenError);
      if (result.left instanceof TeamAccessForbiddenError) {
        expect(result.left.userId).toBe('user-1');
        expect(result.left.teamId).toBe('team-1');
      }
    }
  });
});
