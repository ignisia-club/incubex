-- Migration 12: Every 4- or 5-digit number is a valid Team ID
--
-- Club OS team numbers run 0000-9999 and 00000-99999, so teams no longer need to be
-- listed in public.teams before they can upload. A numeric ID is accepted as-is
-- (leading zeros kept); the INC-12345 format still needs a row in public.teams.
--
--   * team_exists()      -> true for any 4-5 digit ID   (storage upload policy uses this)
--   * get_team_status()  -> exists: true for any 4-5 digit ID
--   * a BEFORE INSERT trigger on submissions adds the team row automatically, so the
--     submissions -> teams foreign key is still satisfied and /admin lists the team.
--
-- Safe to re-run. One transaction: all of it applies, or none of it does.
-- Run AFTER 06 (replaces team_exists from 04 and get_team_status from 06).

BEGIN;

CREATE OR REPLACE FUNCTION public.team_exists(p_team_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT trim(p_team_id) ~ '^[0-9]{4,5}$'
      OR EXISTS (SELECT 1 FROM public.teams WHERE team_id = upper(trim(p_team_id)));
$$;
REVOKE ALL ON FUNCTION public.team_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.team_exists(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_team_status(p_team_id text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'exists', public.team_exists(p_team_id),
    'submitted', (SELECT submitted FROM public.submissions WHERE team_id = upper(trim(p_team_id))),
    'approval_status', (SELECT approval_status FROM public.submissions WHERE team_id = upper(trim(p_team_id))),
    'appeal_message', (SELECT appeal_message FROM public.submissions WHERE team_id = upper(trim(p_team_id)))
  );
$$;
REVOKE ALL ON FUNCTION public.get_team_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_status(text) TO anon, authenticated;

-- Create the team row on first upload for a numeric ID (runs before the foreign key check).
CREATE OR REPLACE FUNCTION public.ensure_team_for_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.team_id ~ '^[0-9]{4,5}$' THEN
    INSERT INTO public.teams (team_id) VALUES (NEW.team_id)
    ON CONFLICT (team_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_team_for_submission() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_ensure_team_for_submission ON public.submissions;
CREATE TRIGGER trg_ensure_team_for_submission
BEFORE INSERT ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.ensure_team_for_submission();

COMMIT;
