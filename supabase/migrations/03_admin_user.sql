-- Migration 03: Create the INCUBEX admin login (idempotent, atomic)
--
-- SECURITY: the admin password is deliberately NOT stored in this repo.
-- Before running, open this file in the Supabase SQL editor and replace
-- __SET_ADMIN_PASSWORD__ with a strong password (12+ chars) THERE ONLY.
-- Never commit the real password. The script refuses to run with the placeholder.
--
-- The whole DO block is a single statement, so it is atomic: either the user
-- and identity are both created/updated, or nothing changes.
-- Safe to re-run: if the user already exists it only resets the password
-- and repairs the auth token columns.
--
-- Admin *privileges* are granted separately in 04 (public.admins table).

DO $$
DECLARE
  v_email    text := 'admin@ignisia.tech';
  v_password text := '__SET_ADMIN_PASSWORD__';
  v_user_id  uuid;
BEGIN
  IF v_password = '__SET_ADMIN_PASSWORD__' OR length(v_password) < 12 THEN
    RAISE EXCEPTION 'Set a strong admin password (12+ chars) in the SQL editor before running. Do not commit it.';
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    -- GoTrue cannot scan NULL token columns ("Database error querying schema"),
    -- so they are explicitly set to empty strings.
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')), now(),
      '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_user_id, v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
      'email', now(), now(), now()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password     = extensions.crypt(v_password, extensions.gen_salt('bf')),
        email_confirmed_at     = COALESCE(email_confirmed_at, now()),
        confirmation_token     = COALESCE(confirmation_token, ''),
        recovery_token         = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change           = COALESCE(email_change, ''),
        updated_at             = now()
    WHERE id = v_user_id;
  END IF;
END $$;
