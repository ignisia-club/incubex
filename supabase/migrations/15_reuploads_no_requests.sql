-- Migration 15: Re-uploads with the Team PIN; no resubmission requests; PIN can't be bypassed
--
--   * A team may upload again with its Team ID + PIN. Every upload is kept as its own row;
--     the newest one counts (Club OS shows it as current and lists the others as earlier).
--     The B2 backup already names re-uploads <team>_v2, _v3, ...
--   * The resubmission request system is removed (submit_appeal + appeal_message).
--   * Uploads only go through submit_deck (ID + PIN checked). The old public INSERT policy
--     from 04 ("Public can submit once per valid team") let anyone add a submission for any
--     team without its PIN; migration 14 dropped a policy name that no longer existed, so it
--     stayed active. It is dropped here, and anon/authenticated lose INSERT on submissions.
--   * get_team_status answers only for the right ID + PIN, and says nothing else otherwise.
--
-- approval_status is no longer used (evaluation happens in Club OS) but the column is kept,
-- because the deployed submissions-api still selects it.
--
-- Safe to re-run. One transaction: all of it applies, or none of it does.
-- Run AFTER 13 and 14, and AFTER the frontend that stops using submit_appeal is live.

BEGIN;

-- 1. No direct inserts: submit_deck is the only way in.
DROP POLICY IF EXISTS "Public can submit once per valid team" ON public.submissions;
DROP POLICY IF EXISTS "Allow public to insert submission" ON public.submissions;
REVOKE INSERT ON public.submissions FROM anon, authenticated;

-- 2. More than one upload per team.
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_team_id_key;
CREATE INDEX IF NOT EXISTS submissions_team_latest_idx ON public.submissions (team_id, submitted_at DESC);

-- 3. Resubmission requests removed.
DROP FUNCTION IF EXISTS public.submit_appeal(text, text, text);
DROP FUNCTION IF EXISTS public.submit_appeal(text, text);
ALTER TABLE public.submissions DROP COLUMN IF EXISTS appeal_message;

-- 4. Lookup: only with the right ID + PIN; then how many uploads and when the last one was.
DROP FUNCTION IF EXISTS public.get_team_status(text);
DROP FUNCTION IF EXISTS public.get_team_status(text, text);
CREATE FUNCTION public.get_team_status(p_team_id text, p_team_pin text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.teams
      WHERE team_id = upper(trim(p_team_id))
        AND team_pin IS NOT NULL AND team_pin <> ''
        AND team_pin = trim(p_team_pin)
    ) THEN jsonb_build_object(
      'exists', true,
      'submitted', EXISTS (SELECT 1 FROM public.submissions WHERE team_id = upper(trim(p_team_id))),
      'uploads', (SELECT count(*) FROM public.submissions WHERE team_id = upper(trim(p_team_id))),
      'last_submitted_at', (SELECT max(submitted_at) FROM public.submissions WHERE team_id = upper(trim(p_team_id)))
    )
    ELSE jsonb_build_object('exists', false)
  END;
$$;
REVOKE ALL ON FUNCTION public.get_team_status(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_status(text, text) TO anon, authenticated;

-- 5. Saving an upload: right ID + PIN, a file that was actually uploaded under this team's
--    name, and at most 20 uploads per team (stops anyone filling the bucket with one PIN).
CREATE OR REPLACE FUNCTION public.submit_deck(p_team_id text, p_team_pin text, p_file_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team text := upper(trim(p_team_id));
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.teams
    WHERE team_id = v_team AND team_pin IS NOT NULL AND team_pin <> '' AND team_pin = trim(p_team_pin)
  ) THEN
    RAISE EXCEPTION 'Incorrect Team ID or PIN' USING ERRCODE = 'P0001';
  END IF;

  IF p_file_path IS NULL OR p_file_path !~ ('^' || v_team || '_[0-9]+\.(pdf|ppt|pptx)$') THEN
    RAISE EXCEPTION 'Invalid file' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'incubex-ppts' AND name = p_file_path) THEN
    RAISE EXCEPTION 'File not found' USING ERRCODE = '22023';
  END IF;

  IF (SELECT count(*) FROM public.submissions WHERE team_id = v_team) >= 20 THEN
    RAISE EXCEPTION 'Upload limit reached' USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.submissions (team_id, ppt_url, submitted, submitted_at)
  VALUES (v_team, p_file_path, true, now());
END;
$$;
REVOKE ALL ON FUNCTION public.submit_deck(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_deck(text, text, text) TO anon, authenticated;

COMMIT;
