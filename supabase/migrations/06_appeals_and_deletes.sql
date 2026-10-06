-- Migration 06: Appeals and Deletion Support
-- Adds appeal tracking and RPCs for the frontend to handle team status and appeals.

BEGIN;

-- 1. Add appeal_message to submissions
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS appeal_message TEXT;

-- 2. Allow admins to read/update the new column
GRANT SELECT, UPDATE (appeal_message) ON public.submissions TO authenticated;

-- 3. RPC to check team status securely (returns a JSON object)
CREATE OR REPLACE FUNCTION public.get_team_status(p_team_id text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'exists', EXISTS(SELECT 1 FROM public.teams WHERE team_id = upper(trim(p_team_id))),
    'submitted', (SELECT submitted FROM public.submissions WHERE team_id = upper(trim(p_team_id))),
    'approval_status', (SELECT approval_status FROM public.submissions WHERE team_id = upper(trim(p_team_id))),
    'appeal_message', (SELECT appeal_message FROM public.submissions WHERE team_id = upper(trim(p_team_id)))
  );
$$;

-- 4. RPC to submit an appeal (only if already submitted)
CREATE OR REPLACE FUNCTION public.submit_appeal(p_team_id text, p_message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.submissions 
  SET appeal_message = p_message
  WHERE team_id = upper(trim(p_team_id)) 
    AND submitted = true;
END;
$$;

-- 5. RPC to delete a submission (Admin only)
-- (Admins already have full access via RLS and dashboard, but we ensure DELETE works)
DROP POLICY IF EXISTS "Admins can delete submissions" ON public.submissions;
CREATE POLICY "Admins can delete submissions"
ON public.submissions FOR DELETE
TO authenticated
USING (public.is_admin());

-- Also grant DELETE on the storage bucket to admins so they can wipe the PPT file
DROP POLICY IF EXISTS "Admins can delete PPTs" ON storage.objects;
CREATE POLICY "Admins can delete PPTs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'incubex-ppts' AND public.is_admin());

-- Ensure column-level delete access
GRANT DELETE ON public.submissions TO authenticated;

REVOKE ALL ON FUNCTION public.get_team_status(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_appeal(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_status(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_appeal(text, text) TO anon, authenticated;

COMMIT;
