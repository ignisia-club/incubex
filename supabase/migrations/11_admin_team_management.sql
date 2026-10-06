-- Migration 11: Let admins manage the team list from /admin (no SQL needed)
--
-- Until now the only way to add Team IDs was SQL. This lets a signed-in admin
-- (a row in public.admins) add and remove teams from the dashboard, and accepts
-- both ID formats:
--   * INC-12345            the original INCUBEX format
--   * 0000-1999 / 20000+   Club OS team numbers (4 or 5 digits, kept as text so leading zeros stay)
--
-- Safe to re-run. One transaction: all of it applies, or none of it does.
-- Run AFTER 04 (needs public.is_admin()).

BEGIN;

-- Optional details shown in /admin and usable later for checking uploads.
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS team_name    TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS leader_email TEXT;

-- New rows must use one of the two formats. NOT VALID: existing rows are not re-checked.
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_team_id_format;
ALTER TABLE public.teams
    ADD CONSTRAINT teams_team_id_format
    CHECK (team_id ~ '^(INC-[0-9]{5}|[0-9]{4,5})$') NOT VALID;

-- Admin-only writes. A team that already has a submission can't be deleted
-- (the submissions -> teams foreign key blocks it), so no deck is ever orphaned.
DROP POLICY IF EXISTS "Admins can add teams" ON public.teams;
CREATE POLICY "Admins can add teams"
ON public.teams FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can edit teams" ON public.teams;
CREATE POLICY "Admins can edit teams"
ON public.teams FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can remove teams" ON public.teams;
CREATE POLICY "Admins can remove teams"
ON public.teams FOR DELETE
TO authenticated
USING (public.is_admin());

GRANT INSERT (team_id, team_name, leader_email) ON public.teams TO authenticated;
GRANT UPDATE (team_name, leader_email) ON public.teams TO authenticated;
GRANT DELETE ON public.teams TO authenticated;

COMMIT;
