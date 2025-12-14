-- Migration script to create personal teams for existing users
-- This script creates personal teams for users who don't have one

DO $$
DECLARE
  user_record RECORD;
  new_team_id UUID;
  new_membership_id UUID;
BEGIN
  -- Loop through all users who don't have a personal team
  FOR user_record IN
    SELECT 
      p.id as user_id,
      p.full_name,
      p.team_id
    FROM profiles p
    WHERE p.team_id IS NULL
       OR NOT EXISTS (
         SELECT 1 
         FROM teams t 
         WHERE t.id = p.team_id AND t.personal = true
       )
  LOOP
    -- Generate new UUIDs
    new_team_id := gen_random_uuid();
    new_membership_id := gen_random_uuid();
    
    -- Create personal team
    INSERT INTO teams (
      id,
      name,
      owner_id,
      personal,
      created_at,
      updated_at
    ) VALUES (
      new_team_id,
      COALESCE(user_record.full_name, 'My Team'),
      user_record.user_id,
      true,
      NOW(),
      NOW()
    );
    
    -- Create team membership
    INSERT INTO team_memberships (
      id,
      team_id,
      user_id,
      role,
      joined_at,
      created_at
    ) VALUES (
      new_membership_id,
      new_team_id,
      user_record.user_id,
      'owner',
      NOW(),
      NOW()
    );
    
    -- Update profile with team_id
    UPDATE profiles
    SET team_id = new_team_id
    WHERE id = user_record.user_id;
    
    RAISE NOTICE 'Created personal team % for user %', new_team_id, user_record.user_id;
  END LOOP;
  
  RAISE NOTICE 'Migration completed';
END $$;

