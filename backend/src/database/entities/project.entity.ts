import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import type { Tables } from '../../type/supabse';

type ProjectRow = Tables<'projects'>;

@Entity({ tableName: 'projects' })
export class ProjectEntity implements ProjectRow {
  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @Property({ nullable: true, columnType: 'text' })
  description!: string | null;

  @Property()
  slug!: string;

  @Property()
  owner_id!: string;

  @Property({ nullable: true, columnType: 'text' })
  default_language!: string | null;

  @Property({
    type: 'array',
    columnType: 'text[]',
    nullable: true,
  })
  languages!: string[] | null;

  @Property({ nullable: true, columnType: 'timestamp' })
  created_at!: string | null;

  @Property({ nullable: true, columnType: 'timestamp' })
  updated_at!: string | null;

  @Property({ default: false })
  is_deleted!: boolean;

  @Property({ nullable: true, columnType: 'timestamp' })
  deleted_at!: string | null;

  @Property({ default: false })
  archived!: boolean;
}
