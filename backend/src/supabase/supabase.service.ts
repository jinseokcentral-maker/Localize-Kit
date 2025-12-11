import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../type/supabse';
import { Data, Effect } from 'effect';

const SUPABASE_ENV_KEYS = {
  url: 'SUPABASE_URL',
  secretKey: 'SUPABASE_SECRET_KEY',
} as const;

type SupabaseConfig = Readonly<{
  url: string;
  secretKey: string;
}>;

class MissingEnvError extends Data.TaggedError('MissingEnvError')<{
  readonly key: string;
}> {}

/**
 * Provides a configured Supabase client using validated environment variables.
 */
@Injectable()
export class SupabaseService {
  private readonly supabaseClient: SupabaseClient<Database>;

  constructor(private readonly configService: ConfigService) {
    const config = this.buildConfig();
    this.supabaseClient = this.createSupabaseClient(config);
  }

  /**
   * Returns the shared Supabase client instance.
   */
  getClient(): SupabaseClient {
    return this.supabaseClient;
  }

  private buildConfig(): SupabaseConfig {
    return Effect.runSync(
      Effect.all({
        url: this.getEnvOrFail(SUPABASE_ENV_KEYS.url),
        secretKey: this.getEnvOrFail(SUPABASE_ENV_KEYS.secretKey),
      }),
    );
  }

  private createSupabaseClient(
    config: SupabaseConfig,
  ): SupabaseClient<Database> {
    return createClient<Database>(config.url, config.secretKey);
  }

  private getEnvOrFail(key: string): Effect.Effect<string, MissingEnvError> {
    return Effect.fromNullable(this.configService.get<string>(key)).pipe(
      Effect.orElseFail(() => new MissingEnvError({ key })),
      Effect.flatMap((value) =>
        value === ''
          ? Effect.fail(new MissingEnvError({ key }))
          : Effect.succeed(value),
      ),
    );
  }
}
