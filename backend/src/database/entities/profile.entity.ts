import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import type { Tables } from '../../type/supabse';

type ProfileRow = Tables<'profiles'>;

@Entity({ tableName: 'profiles' })
export class ProfileEntity implements ProfileRow {
  @PrimaryKey()
  id!: string;

  @Property({ nullable: true })
  email!: string | null;

  @Property({ nullable: true, columnType: 'text' })
  full_name!: string | null;

  @Property({ nullable: true, columnType: 'text' })
  avatar_url!: string | null;

  @Property({ nullable: true, columnType: 'text' })
  plan!: string | null;

  @Property({ nullable: true, columnType: 'text' })
  stripe_customer_id!: string | null;

  @Property({ nullable: true })
  team_id!: string | null;

  @Property({ nullable: true, columnType: 'timestamp' })
  created_at!: string | null;

  @Property({ nullable: true, columnType: 'timestamp' })
  updated_at!: string | null;
}
