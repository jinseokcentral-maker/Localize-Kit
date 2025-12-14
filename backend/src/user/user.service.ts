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
import {
  PersonalTeamNotFoundError,
  UserConflictError,
  UserNotFoundError,
} from './errors/user.errors';
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
    UserConflictError | PersonalTeamNotFoundError
  > {
    return pipe(
      this.insertProfile(input),
      Effect.map((user) => {
        const tokens = this.signTokens(user);
        return { user, ...tokens };
      }),
    );
  }

  getUserById(
    userId: string,
  ): Effect.Effect<User, UserNotFoundError | PersonalTeamNotFoundError> {
    return pipe(
      this.fetchProfileById(userId),
      Effect.flatMap((user) =>
        pipe(
          Effect.tryPromise({
            try: async () => {
              const profile = await this.em.findOne(ProfileEntity, {
                id: userId,
              });
              if (profile === null) {
                throw new UserNotFoundError();
              }
              return profile.full_name;
            },
            catch: () => new UserNotFoundError(),
          }),
          Effect.flatMap((fullName) =>
            pipe(
              this.fetchTeamsInfo(userId, fullName),
              Effect.map((teams) => ({ ...user, teams })),
            ),
          ),
        ),
      ),
    );
  }

  updateUser(
    userId: string,
    input: UpdateUserInput,
  ): Effect.Effect<User, UserNotFoundError | PersonalTeamNotFoundError> {
    return this.updateProfile(userId, input);
  }

  private insertProfile(
    input: RegisterUserInput,
  ): Effect.Effect<User, UserConflictError | PersonalTeamNotFoundError> {
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

        const personalTeam = this.em.create(TeamEntity, {
          name: input.fullName ?? 'My Team',
          owner_id: input.id,
          personal: true,
        });
        await this.em.persistAndFlush(personalTeam);

        profile.team_id = personalTeam.id;
        await this.em.flush();

        const membership = this.em.create(TeamMembershipEntity, {
          team_id: personalTeam.id,
          user_id: input.id,
          role: 'owner',
          joined_at: new Date().toISOString(),
        });
        await this.em.persistAndFlush(membership);

        const user = mapProfileToUser(profile);
        const teamsResult = await Effect.runPromise(
          Effect.either(this.fetchTeamsInfo(profile.id, profile.full_name)),
        );
        if (teamsResult._tag === 'Left') {
          throw teamsResult.left;
        }
        return { ...user, teams: teamsResult.right };
      },
      catch: (err) => {
        if (err instanceof PersonalTeamNotFoundError) {
          return err;
        }
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
  ): Effect.Effect<Omit<User, 'teams'>, UserNotFoundError> {
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
  ): Effect.Effect<User, UserNotFoundError | PersonalTeamNotFoundError> {
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
        const user = mapProfileToUser(profile);
        const teamsResult = await Effect.runPromise(
          Effect.either(this.fetchTeamsInfo(profile.id, profile.full_name)),
        );
        if (teamsResult._tag === 'Left') {
          throw teamsResult.left;
        }
        return { ...user, teams: teamsResult.right };
      },
      catch: (err) => {
        if (err instanceof PersonalTeamNotFoundError) {
          return err;
        }
        return new UserNotFoundError();
      },
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

  private fetchTeamsInfo(
    userId: string,
    fullName: string | null,
  ): Effect.Effect<TeamInfo[], PersonalTeamNotFoundError> {
    return Effect.tryPromise({
      try: async () => {
        const [projectCount, profile, memberships] = await Promise.all([
          this.countProjects(userId),
          this.em.findOne(ProfileEntity, { id: userId }),
          this.em.find(TeamMembershipEntity, { user_id: userId }),
        ]);
        const plan = (profile?.plan ?? 'free') as PlanName;
        const canCreate = canCreateProject(plan, projectCount);

        if (memberships.length === 0) {
          const personalTeamId = profile?.team_id;
          if (!personalTeamId) {
            throw new PersonalTeamNotFoundError({ userId });
          }
          const personalTeam = await this.em.findOne(TeamEntity, {
            id: personalTeamId,
          });
          if (!personalTeam) {
            throw new PersonalTeamNotFoundError({ userId });
          }
          const memberCount = await this.em.count(TeamMembershipEntity, {
            team_id: personalTeamId,
          });
          return [
            {
              teamId: personalTeam.id,
              projectCount,
              plan: profile?.plan ?? 'free',
              canCreateProject: canCreate,
              teamName: personalTeam.name,
              memberCount,
              avatarUrl: personalTeam.avatar_url,
              personal: personalTeam.personal,
            },
          ];
        }

        const teamIds = memberships.map((m) => m.team_id);
        const [teamEntities, memberCounts] = await Promise.all([
          this.em.find(TeamEntity, { id: { $in: teamIds } }),
          Promise.all(
            teamIds.map((teamId) =>
              this.em.count(TeamMembershipEntity, { team_id: teamId }),
            ),
          ),
        ]);

        return teamEntities.map((team, index) => ({
          teamId: team.id,
          projectCount,
          plan: profile?.plan ?? 'free',
          canCreateProject: canCreate,
          teamName: team.name,
          memberCount: memberCounts[index] ?? 0,
          avatarUrl: team.avatar_url,
          personal: team.personal,
        }));
      },
      catch: (err) => {
        if (err instanceof PersonalTeamNotFoundError) {
          return err;
        }
        return new PersonalTeamNotFoundError({ userId });
      },
    });
  }

  private async countProjects(userId: string): Promise<number> {
    const count = await this.em.count(ProjectEntity, { owner_id: userId });
    return count;
  }
}

function mapProfileToUser(
  row: UserProfileRow | ProfileEntity,
): Omit<User, 'teams'> {
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
