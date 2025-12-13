import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import type { Tables } from '../../type/supabse';

type TeamMemberRow = Tables<'team_members'>;

@Entity({ tableName: 'team_members' })
export class TeamMemberEntity implements TeamMemberRow {
  @PrimaryKey()
  id!: string;

  @Property()
  project_id!: string;

  @Property()
  user_id!: string;

  @Property()
  role!: string;

  @Property({ nullable: true, columnType: 'timestamp' })
  invited_at!: string | null;

  @Property({ nullable: true, columnType: 'timestamp' })
  joined_at!: string | null;

  @Property({ nullable: true })
  invited_by!: string | null;

  @Property({ nullable: true, columnType: 'timestamp' })
  created_at!: string | null;
}

