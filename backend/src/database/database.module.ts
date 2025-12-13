import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import type { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { Effect } from 'effect';
import { ProfileEntity } from './entities/profile.entity';
import { ProjectEntity } from './entities/project.entity';
import { TeamMemberEntity } from './entities/team-member.entity';
import { URL } from 'url';

const DB_URL_KEY = 'DB_URL_STRING';

class MissingDbUrlError extends Error {
  constructor() {
    super(`Environment variable ${DB_URL_KEY} is required`);
    this.name = 'MissingDbUrlError';
  }
}

function getDbUrl(configService: ConfigService): string {
  const dbUrl = Effect.runSync(
    Effect.fromNullable(configService.get<string>(DB_URL_KEY)).pipe(
      Effect.orElseFail(() => new MissingDbUrlError()),
      Effect.flatMap((value) =>
        value === ''
          ? Effect.fail(new MissingDbUrlError())
          : Effect.succeed(value),
      ),
    ),
  );
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    throw new Error(
      `Invalid DB_URL_STRING format. Expected postgresql:// or postgres:// connection string, got: ${dbUrl.substring(0, 20)}...`,
    );
  }
  return dbUrl;
}

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): MikroOrmModuleOptions => {
        const dbUrl = getDbUrl(configService);
        const parsedUrl = new URL(dbUrl);
        return {
          driver: PostgreSqlDriver,
          host: parsedUrl.hostname,
          port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 5432,
          user: parsedUrl.username,
          password: parsedUrl.password,
          dbName: parsedUrl.pathname.slice(1),
          entities: [ProfileEntity, ProjectEntity, TeamMemberEntity],
          autoLoadEntities: false,
          connect: true,
          debug: process.env.NODE_ENV !== 'production',
          migrations: {
            path: './migrations',
            transactional: true,
            disableForeignKeys: false,
            allOrNothing: true,
            dropTables: false,
            safe: false,
            snapshot: true,
            emit: 'ts',
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
