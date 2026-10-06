-- Migration 09: Back up each deck the moment it is submitted
--
-- Replaces the manual "Database Webhook" dashboard step. After every INSERT on public.submissions,
-- this trigger POSTs the new row to the `backup-ppt` Edge Function (same payload shape as a Supabase
-- Database Webhook). It reads the project URL and webhook secret from Supabase Vault - the SAME two
-- secrets used by migration 08 - so no secrets are stored in the repo:
--
--   select vault.create_secret('https://<project-ref>.supabase.co', 'backup_project_url');
--   select vault.create_secret('<same value as the WEBHOOK_SECRET function secret>', 'backup_webhook_secret');
--
-- Failure-safe by design: a missing secret or network problem must NEVER block a team's submission,
-- so every error is swallowed here. The 2-hourly sweep (migration 08) picks up anything missed.

BEGIN;

CREATE OR REPLACE FUNCTION public.notify_ppt_backup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_url    text;
  v_secret text;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO v_url
      FROM vault.decrypted_secrets WHERE name = 'backup_project_url' LIMIT 1;
    SELECT decrypted_secret INTO v_secret
      FROM vault.decrypted_secrets WHERE name = 'backup_webhook_secret' LIMIT 1;

    IF v_url IS NOT NULL AND v_secret IS NOT NULL AND NEW.ppt_url IS NOT NULL THEN
      PERFORM net.http_post(
        url     := rtrim(v_url, '/') || '/functions/v1/backup-ppt',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
        body    := jsonb_build_object(
                     'type', 'INSERT',
                     'table', 'submissions',
                     'record', jsonb_build_object('team_id', NEW.team_id, 'ppt_url', NEW.ppt_url)
                   ),
        timeout_milliseconds := 120000
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_ppt_backup failed (sweep will retry): %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_ppt_backup() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_backup_ppt_on_submit ON public.submissions;
CREATE TRIGGER trg_backup_ppt_on_submit
AFTER INSERT ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.notify_ppt_backup();

COMMIT;
