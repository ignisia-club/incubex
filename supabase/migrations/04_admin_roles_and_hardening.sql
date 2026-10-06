-- Migration 04: Real admin roles + security hardening
--
-- Fixes in 00/01:
--   * "TO authenticated" meant ANY signed-up user was an admin (public sign-up is on by default
--     and the anon key ships in the frontend). Admin access now requires a row in public.admins.
--   * teams was world-readable (USING (true)) -> anyone could list every Team ID.
--   * Public inserts could set approval_status = 'approved'.
--   * 25MB limit / file types were only enforced in the browser.
--
-- Runs as one transaction: all of it applies, or none of it does.
-- Run AFTER 03_admin_user.sql.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Admins table + is_admin()
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
    user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- A signed-in user may only see whether THEY are an admin. Nobody can write via the API;
-- admins are added only through numbered migrations.
DROP POLICY IF EXISTS "Users can see own admin row" ON public.admins;
CREATE POLICY "Users can see own admin row"
ON public.admins FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Grant admin to the account created in 03 (no-op if 03 has not been run).
INSERT INTO public.admins (user_id)
SELECT id FROM auth.users WHERE email = 'admin@ignisia.tech'
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Team ID verification without exposing the teams table
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.team_exists(p_team_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.teams WHERE team_id = upper(trim(p_team_id)));
$$;
REVOKE ALL ON FUNCTION public.team_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.team_exists(text) TO anon, authenticated;

DROP POLICY IF EXISTS "Allow public to read specific team by team_id" ON public.teams;
DROP POLICY IF EXISTS "Admins can read teams" ON public.teams;
CREATE POLICY "Admins can read teams"
ON public.teams FOR SELECT
TO authenticated
USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Submissions: admin-only read/update, locked-down public insert
-- ---------------------------------------------------------------------------
ALTER TABLE public.submissions
    DROP CONSTRAINT IF EXISTS submissions_approval_status_check;
ALTER TABLE public.submissions
    ADD CONSTRAINT submissions_approval_status_check
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

DROP POLICY IF EXISTS "Admins can do everything on submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow public to insert submission" ON public.submissions;
DROP POLICY IF EXISTS "Admins can read submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can review submissions" ON public.submissions;
DROP POLICY IF EXISTS "Public can submit once per valid team" ON public.submissions;

CREATE POLICY "Admins can read submissions"
ON public.submissions FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can review submissions"
ON public.submissions FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Team validity is enforced by the FK to teams(team_id) (FK checks bypass RLS),
-- one-per-team by UNIQUE(team_id). The file path must belong to that team.
CREATE POLICY "Public can submit once per valid team"
ON public.submissions FOR INSERT
TO anon, authenticated
WITH CHECK (
    approval_status = 'pending'
    AND review IS NULL
    AND submitted = true
    AND ppt_url LIKE team_id || '\_%'
);

-- Column-level privileges (defence in depth on top of RLS)
REVOKE ALL ON public.teams, public.submissions, public.admins FROM anon, authenticated;
GRANT SELECT ON public.teams TO authenticated;
GRANT SELECT ON public.admins TO authenticated;
GRANT INSERT (team_id, ppt_url, submitted, submitted_at) ON public.submissions TO anon, authenticated;
GRANT SELECT, UPDATE (approval_status, review) ON public.submissions TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Storage: server-side 25MB + file type limits, admin-only downloads
-- ---------------------------------------------------------------------------
UPDATE storage.buckets
SET public = false,
    file_size_limit = 26214400, -- 25MB
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
WHERE id = 'incubex-ppts';

DROP POLICY IF EXISTS "Allow public to upload PPTs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to view PPTs" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload PPTs for valid teams" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read PPTs" ON storage.objects;

-- Files must be named <TEAM_ID>_<timestamp>.<ext> for an existing team.
CREATE POLICY "Public can upload PPTs for valid teams"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
    bucket_id = 'incubex-ppts'
    AND public.team_exists(split_part(name, '_', 1))
);

CREATE POLICY "Admins can read PPTs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'incubex-ppts' AND public.is_admin());

COMMIT;
