-- Migration 05: Fix Malformed Admin User
-- GoTrue throws "Database error querying schema" if manual inserts leave 
-- certain token columns as NULL instead of empty strings. 
-- This script safely drops the broken user and cleanly recreates them with 
-- all the exact column defaults GoTrue's database scanner expects.

BEGIN;

DO $$
DECLARE
  v_email    text := 'admin@ignisia.tech';
  v_password text := 'IncubexAdmin2026!'; -- Safe to hardcode for this specific fix
  v_user_id  uuid := gen_random_uuid();
BEGIN
  -- 1. Wipe the malformed user and identity completely
  DELETE FROM auth.identities WHERE identity_data->>'email' = v_email;
  DELETE FROM auth.users WHERE email = v_email;

  -- 2. Insert the user correctly, explicitly setting token columns to empty strings ('') 
  --    and providing all timestamps so GoTrue doesn't panic on NULLs.
  INSERT INTO auth.users (
    instance_id, 
    id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at,
    confirmation_token, 
    recovery_token, 
    email_change_token_new, 
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', 
    v_user_id, 
    'authenticated', 
    'authenticated', 
    v_email,
    extensions.crypt(v_password, extensions.gen_salt('bf')), 
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb, 
    '{}'::jsonb, 
    now(), 
    now(),
    '', 
    '', 
    '', 
    ''
  );

  -- 3. Insert the identity properly
  INSERT INTO auth.identities (
    id, 
    user_id, 
    provider_id, 
    identity_data, 
    provider, 
    last_sign_in_at, 
    created_at, 
    updated_at
  ) VALUES (
    gen_random_uuid(), 
    v_user_id, 
    v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
    'email', 
    now(), 
    now(), 
    now()
  );

  -- 4. Ensure the new user is granted admin privileges (from migration 04)
  -- (If 04 hasn't run yet, this table might not exist, but we assume it does based on progress)
  IF EXISTS (
      SELECT FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'admins'
  ) THEN
      INSERT INTO public.admins (user_id)
      VALUES (v_user_id)
      ON CONFLICT (user_id) DO NOTHING;
  END IF;

END $$;

COMMIT;
