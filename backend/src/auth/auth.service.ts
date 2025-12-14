import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'crypto';
import { Effect, pipe } from 'effect';
import { SupabaseService } from '../supabase/supabase.service';
import { ProfileEntity } from '../database/entities/profile.entity';
import { TeamEntity } from '../database/entities/team.entity';
import { TeamMembershipEntity } from '../database/entities/team-membership.entity';
import type { User, UserProfileRow } from '../user/user.types';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { JWT_REFRESH_EXPIRES_IN_KEY } from './constants/auth.constants';
import {
  InvalidTeamError,
  InvalidTokenError,
  ProviderAuthError,
  TeamAccessForbiddenError,
} from './errors/auth.errors';
import { jwtPayloadSchema, type JwtPayload } from './guards/jwt-auth.guard';

export type TokenPair = Readonly<{
  accessToken: string;
  refreshToken: string;
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly supabaseService: SupabaseService,
    private readonly em: EntityManager,
  ) {}

  issueTokens(payload: JwtPayload): TokenPair {
    return {
      accessToken: this.signAccessToken(payload),
      refreshToken: this.signRefreshToken(payload),
    };
  }

  refreshTokens(
    refreshToken: string,
  ): Effect.Effect<TokenPair, InvalidTokenError> {
    return pipe(
      this.verifyRefreshToken(refreshToken),
      Effect.map((payload) => this.issueTokens(payload)),
    );
  }

  loginWithGoogleAccessToken(
    accessToken: string,
    teamId?: string,
  ): Effect.Effect<
    TokenPair,
    ProviderAuthError | TeamAccessForbiddenError | InvalidTeamError
  > {
    return pipe(
      this.signInWithGoogle(accessToken),
      Effect.flatMap((authUser) =>
        this.findOrCreateUser(authUser).pipe(
          Effect.flatMap((user) => {
            if (teamId !== undefined) {
              return pipe(
                this.verifyTeamMembership(user.id, teamId),
                Effect.map((verifiedTeamId) =>
                  this.issueTokens({
                    sub: user.id,
                    email: user.email ?? undefined,
                    plan: user.plan ?? undefined,
                    teamId: verifiedTeamId,
                  }),
                ),
              ) as Effect.Effect<
                TokenPair,
                ProviderAuthError | TeamAccessForbiddenError | InvalidTeamError
              >;
            }
            return pipe(
              this.getPersonalTeamId(user.id),
              Effect.map((personalTeamId) =>
                this.issueTokens({
                  sub: user.id,
                  email: user.email ?? undefined,
                  plan: user.plan ?? undefined,
                  teamId: personalTeamId,
                }),
              ),
            ) as Effect.Effect<
              TokenPair,
              ProviderAuthError | TeamAccessForbiddenError | InvalidTeamError
            >;
          }),
        ),
      ),
    );
  }

  switchTeam(
    userId: string,
    teamId: string,
  ): Effect.Effect<TokenPair, TeamAccessForbiddenError | InvalidTeamError> {
    return Effect.tryPromise({
      try: async () => {
        // 먼저 팀이 존재하는지 확인
        const team = await this.em.findOne(TeamEntity, { id: teamId });
        if (team === null) {
          throw new InvalidTeamError({ teamId });
        }
        // 팀이 존재하면 멤버십 확인
        const membership = await this.em.findOne(TeamMembershipEntity, {
          user_id: userId,
          team_id: teamId,
        });
        if (membership === null) {
          throw new TeamAccessForbiddenError({ userId, teamId });
        }
        const profile = await this.em.findOne(ProfileEntity, { id: userId });
        if (profile === null) {
          throw new TeamAccessForbiddenError({ userId, teamId });
        }
        return this.issueTokens({
          sub: userId,
          email: profile.email ?? undefined,
          plan: profile.plan ?? undefined,
          teamId,
        });
      },
      catch: (err) => {
        if (err instanceof InvalidTeamError) {
          return err;
        }
        if (err instanceof TeamAccessForbiddenError) {
          return err;
        }
        return new TeamAccessForbiddenError({ userId, teamId });
      },
    });
  }

  private verifyRefreshToken(
    refreshToken: string,
  ): Effect.Effect<JwtPayload, InvalidTokenError> {
    return Effect.tryPromise({
      try: async () => this.jwtService.verifyAsync(refreshToken),
      catch: (err) =>
        new InvalidTokenError({
          reason: err instanceof Error ? err.message : 'Invalid refresh token',
        }),
    }).pipe(
      Effect.flatMap((payload) =>
        Effect.try({
          try: () => jwtPayloadSchema.parse(payload),
          catch: (err) =>
            new InvalidTokenError({
              reason:
                err instanceof Error ? err.message : 'Invalid token payload',
            }),
        }),
      ),
    );
  }

  private signAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign({
      sub: payload.sub,
      email: payload.email,
      plan: (payload as Record<string, unknown>).plan ?? null,
      teamId: (payload as Record<string, unknown>).teamId ?? null,
    });
  }

  private signRefreshToken(payload: JwtPayload): string {
    const expiresIn =
      this.requireRefreshExpires() as unknown as JwtSignOptions['expiresIn'];
    return this.jwtService.sign(
      {
        sub: payload.sub,
        email: payload.email,
        plan: payload.plan ?? null,
        teamId: (payload as Record<string, unknown>).teamId ?? null,
      },
      { expiresIn },
    );
  }

  private requireRefreshExpires(): string {
    return Effect.runSync(
      Effect.fromNullable(
        this.configService.get<string>(JWT_REFRESH_EXPIRES_IN_KEY),
      ).pipe(
        Effect.orElseFail(
          () =>
            new Error(
              `Environment variable ${JWT_REFRESH_EXPIRES_IN_KEY} is required`,
            ),
        ),
      ),
    );
  }

  private findOrCreateUser(
    authUser: SupabaseAuthUser,
  ): Effect.Effect<User, ProviderAuthError> {
    return Effect.tryPromise({
      try: async () => {
        const existing = await this.em.findOne(ProfileEntity, {
          id: authUser.id,
        });
        if (existing !== null) {
          const user = mapProfileToUser(existing);
          return { ...user, teams: [], activeTeamId: null };
        }

        const now = new Date().toISOString();
        const profile = this.em.create(ProfileEntity, {
          id: authUser.id ?? randomUUID(),
          email: authUser.email,
          full_name:
            typeof authUser.user_metadata?.full_name === 'string'
              ? authUser.user_metadata.full_name
              : typeof authUser.user_metadata?.name === 'string'
                ? authUser.user_metadata.name
                : null,
          avatar_url:
            typeof authUser.user_metadata?.avatar_url === 'string'
              ? authUser.user_metadata.avatar_url
              : typeof authUser.user_metadata?.picture === 'string'
                ? authUser.user_metadata.picture
                : null,
          plan: 'free',
          created_at: now,
          updated_at: now,
        });
        await this.em.persistAndFlush(profile);
        const user = mapProfileToUser(profile);
        return { ...user, teams: [], activeTeamId: null };
      },
      catch: (err) => {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to upsert user';
        // 데이터베이스 연결 에러인 경우 더 명확한 메시지 제공
        if (
          errorMessage.includes('ECONNRESET') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('ETIMEDOUT') ||
          errorMessage.includes('connection')
        ) {
          return new ProviderAuthError(
            `Database connection error: ${errorMessage}. Please try again.`,
          );
        }
        return new ProviderAuthError(errorMessage);
      },
    });
  }

  private verifyTeamMembership(
    userId: string,
    teamId: string,
  ): Effect.Effect<string, TeamAccessForbiddenError | InvalidTeamError> {
    return Effect.tryPromise({
      try: async () => {
        // 먼저 팀이 존재하는지 확인
        const team = await this.em.findOne(TeamEntity, { id: teamId });
        if (team === null) {
          throw new InvalidTeamError({ teamId });
        }
        // 팀이 존재하면 멤버십 확인
        const membership = await this.em.findOne(TeamMembershipEntity, {
          user_id: userId,
          team_id: teamId,
        });
        if (membership === null) {
          throw new TeamAccessForbiddenError({ userId, teamId });
        }
        return teamId;
      },
      catch: (err) => {
        if (err instanceof InvalidTeamError) {
          return err;
        }
        if (err instanceof TeamAccessForbiddenError) {
          return err;
        }
        return new TeamAccessForbiddenError({ userId, teamId });
      },
    });
  }

  private getPersonalTeamId(
    userId: string,
  ): Effect.Effect<string | undefined, ProviderAuthError> {
    return Effect.tryPromise({
      try: async () => {
        const profile = await this.em.findOne(ProfileEntity, { id: userId });
        if (profile === null || profile.team_id === null) {
          return undefined;
        }
        const team = await this.em.findOne(TeamEntity, {
          id: profile.team_id,
          personal: true,
        });
        return team?.id;
      },
      catch: (err) =>
        new ProviderAuthError(
          err instanceof Error ? err.message : 'Failed to get personal team',
        ),
    });
  }

  private signInWithGoogle(
    accessToken: string,
  ): Effect.Effect<SupabaseAuthUser, ProviderAuthError> {
    const client = this.supabaseService.getClient();
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await client.auth.getUser(accessToken);
        if (error !== null || data.user === null) {
          throw new ProviderAuthError(
            error?.message ?? 'Failed to authenticate with provider',
          );
        }
        return data.user;
      },
      catch: (err) =>
        new ProviderAuthError(
          err instanceof Error ? err.message : 'Provider auth failed',
        ),
    });
  }
}

function mapProfileToUser(
  row: UserProfileRow | ProfileEntity,
): Omit<User, 'teams' | 'activeTeamId'> {
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
