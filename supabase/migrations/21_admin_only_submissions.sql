-- Migration 21: Lock submit_deck to admins only (submission period closed)
--
-- The submission window has closed. This migration replaces the public submit_deck
-- function with an admin-only version so that direct API calls are also blocked,
-- not just the frontend UI.

BEGIN;

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
BEGIN
  -- Submission period has ended.
  IF NOT public.is_admin() THEN
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

  -- Enforce per-team upload cap.
  IF (SELECT count(*) FROM public.submissions WHERE team_id = v_team) >= 10 THEN
    RAISE EXCEPTION 'Upload limit reached' USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.submissions (team_id, ppt_url, submitted, submitted_at)
  VALUES (v_team, p_file_path, true, now());
END;
$$;

-- Remove anon access; only authenticated sessions that also satisfy is_admin()
-- can reach this function.
REVOKE ALL ON FUNCTION public.submit_deck(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_deck(text, text, text) TO authenticated;

COMMIT;
