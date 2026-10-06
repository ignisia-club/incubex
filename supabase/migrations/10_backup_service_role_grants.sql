-- Migration 10: Let the `backup-ppt` Edge Function (service_role) read/write what it needs.
-- On this project service_role has no default table privileges in `public`, so grant the minimum:
--   * read submissions (to find decks that still need a backup)
--   * read/insert/update the backup log
-- No delete, and no access to teams/admins.

BEGIN;

GRANT SELECT ON public.submissions TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.ppt_backups TO service_role;

COMMIT;
