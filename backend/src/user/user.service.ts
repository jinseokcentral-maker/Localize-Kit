import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { Effect, pipe } from 'effect';
import { JWT_REFRESH_EXPIRES_IN_KEY } from '../auth/constants/auth.constants';
import { SupabaseService } from '../supabase/supabase.service';
import { UserConflictError, UserNotFoundError } from './errors/user.errors';
import type { RegisterUserInput, UpdateUserInput } from './user.schemas';
import type { User, UserProfileRow } from './user.types';

const USER_CONFLICT_CODE = '23505';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
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
      this.fetchProfileById(userId),
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
    const client = this.supabaseService.getClient();
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await client
          .from('profiles')
          .insert({
            id: input.id,
            email: input.email,
            full_name: input.fullName,
            avatar_url: input.avatarUrl,
            plan: input.plan,
          })
          .select('*')
          .single<UserProfileRow>();
        if (error !== null) {
          if (error.code === USER_CONFLICT_CODE) {
            throw new UserConflictError({ reason: error.message });
          }
          throw new Error(error.message);
        }
        return mapProfileToUser(data);
      },
      catch: (err) =>
        err instanceof UserConflictError
          ? err
          : new UserConflictError({
              reason: err instanceof Error ? err.message : 'Conflict',
            }),
    });
  }

  private fetchProfileById(
    userId: string,
  ): Effect.Effect<User, UserNotFoundError> {
    const client = this.supabaseService.getClient();
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single<UserProfileRow>();
        if (error !== null || data === null) {
          throw new UserNotFoundError();
        }
        return mapProfileToUser(data);
      },
      catch: () => new UserNotFoundError(),
    });
  }

  private updateProfile(
    userId: string,
    input: UpdateUserInput,
  ): Effect.Effect<User, UserNotFoundError> {
    const client = this.supabaseService.getClient();
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await client
          .from('profiles')
          .update({
            full_name: input.fullName,
            avatar_url: input.avatarUrl,
            plan: input.plan,
          })
          .eq('id', userId)
          .select('*')
          .single<UserProfileRow>();
        if (error !== null || data === null) {
          throw new UserNotFoundError();
        }
        return mapProfileToUser(data);
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
}

function mapProfileToUser(row: UserProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    plan: row.plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
