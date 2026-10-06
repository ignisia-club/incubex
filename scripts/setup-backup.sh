#!/usr/bin/env bash
# One-shot setup for the Backblaze B2 secondary backup. Safe to re-run.
#
#   1. Create a private B2 bucket + a bucket-scoped application key (no delete permission).
#   2. Save the B2 values to .env.backup.local (gitignored) - the file this script reads.
#   3. Run:  scripts/setup-backup.sh <supabase-project-ref>
#
# Requires the Supabase CLI logged in (`supabase login`) to an account that can access the project.
# Does:  link project -> run migrations 07-10 -> set function secrets -> deploy `backup-ppt`
#        -> store the cron/trigger secrets in Vault -> run a first sweep (backs up existing decks).
#
# No secrets are written anywhere except .env.backup.local (gitignored) and Supabase itself.
set -euo pipefail

REF="${1:-}"
[ -n "$REF" ] || { echo "Usage: scripts/setup-backup.sh <supabase-project-ref>   (e.g. the part before .supabase.co)"; exit 1; }

cd "$(dirname "$0")/.."
ENV_FILE=".env.backup.local"
[ -f "$ENV_FILE" ] || { echo "Missing $ENV_FILE (needs B2_KEY_ID, B2_APP_KEY, B2_BUCKET, B2_ENDPOINT)."; exit 1; }
command -v supabase >/dev/null || { echo "Supabase CLI not found on PATH (try: export PATH=\$HOME/.local/bin:\$PATH)"; exit 1; }

# Generate the shared webhook secret once and keep it in the same gitignored file.
if ! grep -q '^WEBHOOK_SECRET=' "$ENV_FILE"; then
  echo "WEBHOOK_SECRET=$(openssl rand -hex 32)" >> "$ENV_FILE"
  echo "Generated a new WEBHOOK_SECRET."
fi
set -a; . "./$ENV_FILE"; set +a
for v in B2_KEY_ID B2_APP_KEY B2_BUCKET B2_ENDPOINT WEBHOOK_SECRET; do
  [ -n "${!v:-}" ] || { echo "$v is empty in $ENV_FILE"; exit 1; }
done

echo "==> Checking access to project $REF"
if ! supabase functions list --project-ref "$REF" >/dev/null 2>&1; then
  echo "ERROR: the logged-in Supabase account cannot access project '$REF'."
  echo "       Run 'supabase login' as the account that owns/administers this project (or use an access token"
  echo "       from that account via SUPABASE_ACCESS_TOKEN) and try again."
  exit 1
fi

echo "==> Linking project"
supabase link --project-ref "$REF" --yes >/dev/null

echo "==> Running migrations 07-10"
for f in supabase/migrations/07_ppt_backups.sql supabase/migrations/08_backup_sweep_schedule.sql supabase/migrations/09_backup_on_submit_trigger.sql supabase/migrations/10_backup_service_role_grants.sql; do
  echo "    $f"
  supabase db query --linked -f "$f" >/dev/null
done

echo "==> Storing project URL + webhook secret in Vault (used by the trigger and the 2-hourly cron job)"
supabase db query --linked "
DO \$\$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM vault.secrets WHERE name = 'backup_project_url';
  IF v_id IS NULL THEN PERFORM vault.create_secret('https://${REF}.supabase.co', 'backup_project_url');
  ELSE PERFORM vault.update_secret(v_id, 'https://${REF}.supabase.co', 'backup_project_url'); END IF;

  SELECT id INTO v_id FROM vault.secrets WHERE name = 'backup_webhook_secret';
  IF v_id IS NULL THEN PERFORM vault.create_secret('${WEBHOOK_SECRET}', 'backup_webhook_secret');
  ELSE PERFORM vault.update_secret(v_id, '${WEBHOOK_SECRET}', 'backup_webhook_secret'); END IF;
END \$\$;" >/dev/null

echo "==> Setting Edge Function secrets"
supabase secrets set --project-ref "$REF" \
  WEBHOOK_SECRET="$WEBHOOK_SECRET" B2_KEY_ID="$B2_KEY_ID" B2_APP_KEY="$B2_APP_KEY" \
  B2_BUCKET="$B2_BUCKET" B2_ENDPOINT="$B2_ENDPOINT" >/dev/null

echo "==> Deploying backup-ppt"
supabase functions deploy backup-ppt --project-ref "$REF" --no-verify-jwt

echo "==> First sweep (backs up any decks already submitted)"
curl -sS -X POST "https://${REF}.supabase.co/functions/v1/backup-ppt" \
  -H "x-webhook-secret: ${WEBHOOK_SECRET}" -H "Content-Type: application/json" -d '{"sweep": true}'
echo
echo "Done. Check results: select team_id, backup_key, status, error from ppt_backups;"
