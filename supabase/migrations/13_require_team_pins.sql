BEGIN;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS team_pin TEXT;

DROP FUNCTION IF EXISTS public.get_team_status(text);
CREATE OR REPLACE FUNCTION public.get_team_status(p_team_id text, p_team_pin text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'exists', EXISTS (SELECT 1 FROM public.teams WHERE team_id = upper(trim(p_team_id)) AND team_pin = trim(p_team_pin)),
    'submitted', (SELECT submitted FROM public.submissions WHERE team_id = upper(trim(p_team_id))),
    'approval_status', (SELECT approval_status FROM public.submissions WHERE team_id = upper(trim(p_team_id))),
    'appeal_message', (SELECT appeal_message FROM public.submissions WHERE team_id = upper(trim(p_team_id)))
  );
$$;
REVOKE ALL ON FUNCTION public.get_team_status(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_status(text, text) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.submit_appeal(text, text);
CREATE OR REPLACE FUNCTION public.submit_appeal(p_team_id text, p_team_pin text, p_message text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.teams WHERE team_id = upper(trim(p_team_id)) AND team_pin = trim(p_team_pin)) THEN
    UPDATE public.submissions SET appeal_message = p_message WHERE team_id = upper(trim(p_team_id)) AND submitted = true;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_appeal(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_appeal(text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.ensure_team_for_submission() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Auto-creation disabled. Must be synced from Appwrite.
  RETURN NEW;
END;
$$;
COMMIT;
