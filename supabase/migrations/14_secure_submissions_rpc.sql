BEGIN;

DROP POLICY IF EXISTS "Allow public to insert submission" ON public.submissions;

CREATE OR REPLACE FUNCTION public.submit_deck(p_team_id text, p_team_pin text, p_file_path text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE team_id = upper(trim(p_team_id)) AND team_pin = trim(p_team_pin)) THEN
    RAISE EXCEPTION 'Incorrect Team ID or PIN';
  END IF;

  INSERT INTO public.submissions (team_id, ppt_url, submitted, submitted_at)
  VALUES (upper(trim(p_team_id)), p_file_path, true, now());
END;
$$;
REVOKE ALL ON FUNCTION public.submit_deck(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_deck(text, text, text) TO anon, authenticated;

COMMIT;
