import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import { Effect, pipe } from 'effect';
import { JWT_REFRESH_EXPIRES_IN_KEY } from '../auth/constants/auth.constants';
import { ProfileEntity } from '../database/entities/profile.entity';
import { ProjectEntity } from '../database/entities/project.entity';
import { TeamEntity } from '../database/entities/team.entity';
import { TeamMembershipEntity } from '../database/entities/team-membership.entity';
import { canCreateProject, type PlanName } from '../project/plan/plan.util';
import { UserConflictError, UserNotFoundError } from './errors/user.errors';
import type { RegisterUserInput, UpdateUserInput } from './user.schemas';
import type { TeamInfo, User, UserProfileRow } from './user.types';

const USER_CONFLICT_CODE = '23505';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,

    private readonly jwtService: JwtService,
    private readonly em: EntityManager,
  ) {}

  registerUser(
    input: RegisterUserInput,
  ): Effect.Effect<
    { user: User; accessToken: string; refreshToken: string },
    UserConflictError
  > {
    return pipe(
      this.insertProfile(input),
      Effect.map((user) => {
        const tokens = this.signTokens(user);
        return { user, ...tokens };
      }),
    );
  }

  getUserById(userId: string): Effect.Effect<User, UserNotFoundError> {
    return pipe(
      Effect.all({
        user: this.fetchProfileById(userId),
        teamInfo: this.fetchTeamInfo(userId),
      }),
      Effect.map(({ user, teamInfo }) => ({
        ...user,
        team: teamInfo,
      })),
      Effect.mapError(() => new UserNotFoundError()),
    );
  }

  updateUser(
    userId: string,
    input: UpdateUserInput,
  ): Effect.Effect<User, UserNotFoundError> {
    return pipe(
      this.updateProfile(userId, input),
      Effect.mapError(() => new UserNotFoundError()),
    );
  }

  private insertProfile(
    input: RegisterUserInput,
  ): Effect.Effect<User, UserConflictError> {
    return Effect.tryPromise({
      try: async () => {
        const profile = this.em.create(ProfileEntity, {
          id: input.id,
          email: input.email,
          full_name: input.fullName,
          avatar_url: input.avatarUrl,
          plan: input.plan,
        });
        await this.em.persistAndFlush(profile);
        return mapProfileToUser(profile);
      },
      catch: (err) => {
        if (
          err instanceof Error &&
          (err.message.includes('duplicate') ||
            err.message.includes('unique') ||
            err.message.includes('23505'))
        ) {
          return new UserConflictError({
            reason: err.message,
          });
        }
        return new UserConflictError({
          reason: err instanceof Error ? err.message : 'Conflict',
        });
      },
    });
  }

  private fetchProfileById(
    userId: string,
  ): Effect.Effect<User, UserNotFoundError> {
    return Effect.tryPromise({
      try: async () => {
        const profile = await this.em.findOne(ProfileEntity, { id: userId });
        if (profile === null) {
          throw new UserNotFoundError();
        }
        return mapProfileToUser(profile);
      },
      catch: () => new UserNotFoundError(),
    });
  }

  private updateProfile(
    userId: string,
    input: UpdateUserInput,
  ): Effect.Effect<User, UserNotFoundError> {
    return Effect.tryPromise({
      try: async () => {
        const profile = await this.em.findOne(ProfileEntity, { id: userId });
        if (profile === null) {
          throw new UserNotFoundError();
        }
        if (input.fullName !== undefined) {
          profile.full_name = input.fullName;
        }
        if (input.avatarUrl !== undefined) {
          profile.avatar_url = input.avatarUrl;
        }
        if (input.plan !== undefined) {
          profile.plan = input.plan;
        }
        await this.em.flush();
        return mapProfileToUser(profile);
      },
      catch: () => new UserNotFoundError(),
    });
  }

  private signUserToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      plan: user.plan,
    });
  }

  private signRefreshToken(user: User): string {
    const refreshExpiresIn = requireEnv(
      this.configService,
      JWT_REFRESH_EXPIRES_IN_KEY,
    ) as unknown as JwtSignOptions['expiresIn'];
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
      },
      { expiresIn: refreshExpiresIn },
    );
  }

  private signTokens(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.signUserToken(user),
      refreshToken: this.signRefreshToken(user),
    };
  }

  private fetchTeamInfo(userId: string): Effect.Effect<TeamInfo, never> {
    return Effect.tryPromise({
      try: async () => {
        const [projectCount, profile] = await Promise.all([
          this.countProjects(userId),
          this.em.findOne(ProfileEntity, { id: userId }),
        ]);
        const plan = (profile?.plan ?? 'free') as PlanName;
        const canCreate = canCreateProject(plan, projectCount);

        let teamName: string | null = null;
        let memberCount = 0;
        if (profile?.team_id !== null && profile?.team_id !== undefined) {
          const [team, count] = await Promise.all([
            this.em.findOne(TeamEntity, { id: profile.team_id }),
            this.em.count(TeamMembershipEntity, { team_id: profile.team_id }),
          ]);
          teamName = team?.name ?? null;
          memberCount = count;
        }

        return {
          projectCount,
          plan: profile?.plan ?? 'free',
          canCreateProject: canCreate,
          teamName,
          memberCount,
        };
      },
      catch: () => new Error('Failed to fetch team info'),
    }).pipe(
      Effect.catchAll(() =>
        Effect.succeed({
          projectCount: 0,
          plan: 'free',
          canCreateProject: false,
          teamName: null,
          memberCount: 0,
        }),
      ),
    );
  }

  private async countProjects(userId: string): Promise<number> {
    const count = await this.em.count(ProjectEntity, { owner_id: userId });
    return count;
  }
}

function mapProfileToUser(row: UserProfileRow | ProfileEntity): User {
  const profileRow =
    row instanceof ProfileEntity
      ? {
          id: row.id,
          email: row.email,
          full_name: row.full_name,
          avatar_url: row.avatar_url,
          plan: row.plan,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }
      : row;
  return {
    id: profileRow.id,
    email: profileRow.email,
    fullName: profileRow.full_name,
    avatarUrl: profileRow.avatar_url,
    plan: profileRow.plan,
    createdAt: profileRow.created_at,
    updatedAt: profileRow.updated_at,
  };
}

function requireEnv(configService: ConfigService, key: string): string {
  return Effect.runSync(
    Effect.fromNullable(configService.get<string>(key)).pipe(
      Effect.orElseFail(
        () => new Error(`Environment variable ${key} is required`),
      ),
    ),
  );
}
