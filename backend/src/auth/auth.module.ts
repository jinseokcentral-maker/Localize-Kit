import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  JwtModule,
  type JwtModuleOptions,
  type JwtSignOptions,
} from '@nestjs/jwt';
import { Data, Effect } from 'effect';
import { JWT_EXPIRES_IN_KEY, JWT_SECRET_KEY } from './constants/auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

class MissingJwtEnvError extends Data.TaggedError('MissingJwtEnvError')<{
  readonly key: string;
}> {}

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = requireEnv(configService, JWT_SECRET_KEY);
        const expiresIn = requireEnv(
          configService,
          JWT_EXPIRES_IN_KEY,
        ) as JwtSignOptions['expiresIn'];
        const options: JwtModuleOptions = {
          secret,
          signOptions: { expiresIn },
        };
        return options;
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}

function requireEnv(configService: ConfigService, key: string): string {
  return Effect.runSync(
    Effect.fromNullable(configService.get<string>(key)).pipe(
      Effect.orElseFail(() => new MissingJwtEnvError({ key })),
    ),
  );
}
