import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SupabaseModule } from './supabase/supabase.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { DatabaseModule } from './database/database.module';
import { TeamModule } from './team/team.module';
import { DebugModule } from './debug/debug.module';

const PRODUCTION_ENV = 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === PRODUCTION_ENV ? undefined : '.env.local',
      ignoreEnvFile: process.env.NODE_ENV === PRODUCTION_ENV,
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    SupabaseModule,
    UserModule,
    ProjectModule,
    TeamModule,
    DebugModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
