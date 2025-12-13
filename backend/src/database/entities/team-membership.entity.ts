import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import type { Tables } from '../../type/supabse';

type TeamMembershipRow = Tables<'team_memberships'>;

@Entity({ tableName: 'team_memberships' })
export class TeamMembershipEntity implements TeamMembershipRow {
  @PrimaryKey()
  id!: string;

  @Property()
  team_id!: string;

  @Property()
  user_id!: string;

  @Property()
  role!: string;

  @Property({ nullable: true, columnType: 'timestamp' })
  joined_at!: string | null;

  @Property({ nullable: true, columnType: 'timestamp' })
  created_at!: string | null;
}

