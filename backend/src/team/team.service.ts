import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'crypto';
import { Effect } from 'effect';
import { TeamEntity } from '../database/entities/team.entity';
import { TeamMembershipEntity } from '../database/entities/team-membership.entity';
import type { CreateTeamInput } from './team.schemas';

@Injectable()
export class TeamService {
  constructor(private readonly em: EntityManager) {}

  createTeam(
    ownerId: string,
    input: CreateTeamInput,
  ): Effect.Effect<void, Error> {
    return Effect.tryPromise({
      try: async () => {
        const now = new Date().toISOString();
        const teamId = randomUUID();

        const team = this.em.create(TeamEntity, {
          id: teamId,
          name: input.name,
          owner_id: ownerId,
          avatar_url: input.avatarUrl ?? null,
          personal: false,
          created_at: now,
          updated_at: now,
        });

        const membership = this.em.create(TeamMembershipEntity, {
          id: randomUUID(),
          team_id: teamId,
          user_id: ownerId,
          role: 'owner',
          joined_at: now,
          created_at: now,
        });

        await this.em.persistAndFlush([team, membership]);
      },
      catch: (err) =>
        err instanceof Error ? err : new Error('Create team failed'),
    });
  }
}
