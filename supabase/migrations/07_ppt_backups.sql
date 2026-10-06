-- Migration 07: Secondary backup log for submitted presentations
-- Every submitted deck is copied to Backblaze B2 by the `backup-ppt` Edge Function.
-- This table records each copy so a missing/failed backup is visible and retryable.
-- Only the Edge Function (service role) writes here; admins can read it.

BEGIN;

CREATE TABLE IF NOT EXISTS public.ppt_backups (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id      VARCHAR(50) NOT NULL,
    source_path  TEXT NOT NULL UNIQUE,   -- path inside the incubex-ppts bucket (idempotency key)
    version      INTEGER NOT NULL,       -- 1 = first upload, 2 = re-upload after an admin reset, ...
    backup_key   TEXT NOT NULL,          -- object name in the B2 bucket, e.g. INC-12345.pdf / INC-12345_v2.pdf
    status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    size_bytes   BIGINT,
    error        TEXT,
    attempts     INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    backed_up_at TIMESTAMPTZ,
    UNIQUE (team_id, version)
);

-- Deliberately NOT a foreign key to submissions/teams: backups must survive an admin
-- deleting a submission (that is the whole point of having a backup).

ALTER TABLE public.ppt_backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read backup log" ON public.ppt_backups;
CREATE POLICY "Admins can read backup log"
ON public.ppt_backups FOR SELECT
TO authenticated
USING (public.is_admin());

REVOKE ALL ON public.ppt_backups FROM PUBLIC, anon;
GRANT SELECT ON public.ppt_backups TO authenticated;

COMMIT;
