-- Migration 22: Upload Toggle Settings
--
-- Enables admins to toggle the deck upload portal between Open and Closed dynamically.
-- When enabled, teams with a valid Team ID and PIN can upload decks (up to 10 per team).
-- When disabled, submissions are blocked at both UI and RPC level (except for admins).

BEGIN;

-- 1. App settings table to store dynamic feature configurations
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read app settings" ON public.app_settings;
CREATE POLICY "Public read app settings" ON public.app_settings
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin manage app settings" ON public.app_settings;
CREATE POLICY "Admin manage app settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Default upload submissions to true (open)
INSERT INTO public.app_settings (key, value, updated_at)
VALUES ('upload_submissions', jsonb_build_object('enabled', true), now())
ON CONFLICT (key) DO NOTHING;

-- 2. Read helper: check if upload portal is currently open
CREATE OR REPLACE FUNCTION public.get_upload_status()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(
    (SELECT (value->>'enabled')::boolean FROM public.app_settings WHERE key = 'upload_submissions'),
    true
  );
$$;

REVOKE ALL ON FUNCTION public.get_upload_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_upload_status() TO anon, authenticated;

-- 3. Write helper: admins toggle upload status
CREATE OR REPLACE FUNCTION public.set_upload_status(p_enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.app_settings (key, value, updated_at)
  VALUES ('upload_submissions', jsonb_build_object('enabled', p_enabled), now())
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at;

  RETURN p_enabled;
END;
$$;

REVOKE ALL ON FUNCTION public.set_upload_status(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_upload_status(boolean) TO authenticated;

-- 4. Update submit_deck to respect app_settings
CREATE OR REPLACE FUNCTION public.submit_deck(
  p_team_id   text,
  p_team_pin  text,
  p_file_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team text := upper(trim(p_team_id));
  v_enabled boolean;
BEGIN
  -- Check if uploads are currently enabled
  SELECT coalesce(
    (SELECT (value->>'enabled')::boolean FROM public.app_settings WHERE key = 'upload_submissions'),
    true
  ) INTO v_enabled;

  IF NOT v_enabled AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Submission period has closed.'
      USING ERRCODE = '42501';
  END IF;

  -- Validate team credentials.
  IF NOT EXISTS (
    SELECT 1 FROM public.teams
    WHERE team_id  = v_team
      AND team_pin IS NOT NULL
      AND team_pin <> ''
      AND team_pin  = trim(p_team_pin)
  ) THEN
    RAISE EXCEPTION 'Incorrect Team ID or PIN' USING ERRCODE = 'P0001';
  END IF;

  -- Validate file name format: TEAMID_timestamp.(pdf|ppt|pptx)
  IF p_file_path IS NULL
    OR p_file_path !~ ('^' || v_team || '_[0-9]+\.(pdf|ppt|pptx)$')
  THEN
    RAISE EXCEPTION 'Invalid file' USING ERRCODE = '22023';
  END IF;

  -- Confirm the object was actually uploaded to storage.
  IF NOT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'incubex-ppts'
      AND name      = p_file_path
  ) THEN
    RAISE EXCEPTION 'File not found' USING ERRCODE = '22023';
  END IF;

  -- Enforce per-team upload cap (10 uploads).
  IF (SELECT count(*) FROM public.submissions WHERE team_id = v_team) >= 10 THEN
    RAISE EXCEPTION 'Upload limit reached' USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.submissions (team_id, ppt_url, submitted, submitted_at)
  VALUES (v_team, p_file_path, true, now());
END;
$$;

-- Allow anon and authenticated to call submit_deck (permission check inside function handles lock)
REVOKE ALL ON FUNCTION public.submit_deck(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_deck(text, text, text) TO anon, authenticated;

COMMIT;
