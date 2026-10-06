-- Migration 08: Retry missing / failed PPT backups every 2 hours
--
-- A pg_cron job calls the `backup-ppt` Edge Function with {"sweep": true}, which backs up every
-- submission that has no successful row in public.ppt_backups yet (max 20 per run).
--
-- NO SECRETS LIVE IN THIS FILE. The project URL and the webhook secret are read at run time from
-- Supabase Vault. Set them ONCE after running this migration (see README, "Secondary Backup"):
--
--   select vault.create_secret('https://<project-ref>.supabase.co', 'backup_project_url');
--   select vault.create_secret('<same value as the WEBHOOK_SECRET function secret>', 'backup_webhook_secret');
--
-- Until both exist the job is a harmless no-op that just logs a notice.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.run_ppt_backup_sweep()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_url    text;
  v_secret text;
  v_req    bigint;
BEGIN
  SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets WHERE name = 'backup_project_url' LIMIT 1;
  SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets WHERE name = 'backup_webhook_secret' LIMIT 1;

  IF v_url IS NULL OR v_secret IS NULL THEN
    RAISE NOTICE 'run_ppt_backup_sweep: vault secrets backup_project_url / backup_webhook_secret are not set; skipping.';
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url     := rtrim(v_url, '/') || '/functions/v1/backup-ppt',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body    := '{"sweep": true}'::jsonb,
    timeout_milliseconds := 120000
  ) INTO v_req;

  RETURN v_req;
END;
$$;

-- Only the cron job (runs as postgres) should ever call this.
REVOKE ALL ON FUNCTION public.run_ppt_backup_sweep() FROM PUBLIC, anon, authenticated;

-- (Re)create the schedule idempotently: every 2 hours, on the hour.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'incubex-ppt-backup-sweep') THEN
    PERFORM cron.unschedule('incubex-ppt-backup-sweep');
  END IF;
  PERFORM cron.schedule('incubex-ppt-backup-sweep', '0 */2 * * *', 'SELECT public.run_ppt_backup_sweep();');
END
$$;

COMMIT;
