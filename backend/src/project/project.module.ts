import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from '../auth/auth.module';
import { ProjectEntity } from '../database/entities/project.entity';
import { TeamMemberEntity } from '../database/entities/team-member.entity';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  imports: [
    AuthModule,
    MikroOrmModule.forFeature([ProjectEntity, TeamMemberEntity]),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}

