import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import type { Tables } from '../../type/supabse';

type TeamRow = Tables<'teams'>;

@Entity({ tableName: 'teams' })
export class TeamEntity implements TeamRow {
  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @Property()
  owner_id!: string;

  @Property({ nullable: true, columnType: 'timestamp' })
  created_at!: string | null;

  @Property({ nullable: true, columnType: 'timestamp' })
  updated_at!: string | null;

  @Property({ nullable: true, columnType: 'text' })
  avatar_url!: string | null;

  @Property({ default: false })
  personal!: boolean;
}

