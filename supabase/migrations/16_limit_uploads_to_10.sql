-- Migration 16: Limit total uploads per team to 10
--
-- Lowers the max upload count per team from 20 to 10 in submit_deck.

BEGIN;

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

  IF (SELECT count(*) FROM public.submissions WHERE team_id = v_team) >= 10 THEN
    RAISE EXCEPTION 'Upload limit reached' USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.submissions (team_id, ppt_url, submitted, submitted_at)
  VALUES (v_team, p_file_path, true, now());
END;
$$;

REVOKE ALL ON FUNCTION public.submit_deck(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_deck(text, text, text) TO anon, authenticated;

COMMIT;
