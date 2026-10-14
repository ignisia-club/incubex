-- Migration 19: Event Days — Day-based scheduling for time slots
--
-- Adds a first-class "event_days" concept so admins can create named days
-- (e.g. "Day 1 – Oct 15" or "Finals – Oct 16") and assign slots to them.
-- Identical slot times on different days are fully supported.
--
-- Changes:
--   1. New table: public.event_days (id, day_name, event_date, sort_order, created_at)
--   2. New column: public.time_slots.day_id (nullable FK → event_days, ON DELETE SET NULL)
--   3. Admin RPCs: admin_get_days, admin_upsert_day, admin_delete_day
--   4. Updated: admin_get_slots_overview — includes day_id, day_name, event_date per slot
--   5. Updated: get_public_time_slots     — includes day_id, day_name, event_date per slot
--
-- Backward compatible: existing slots where day_id IS NULL are still returned fine.
-- Safe to re-run (CREATE OR REPLACE / IF NOT EXISTS throughout).

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. event_days table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.event_days (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    day_name    TEXT        NOT NULL,
    event_date  DATE        NOT NULL,
    sort_order  INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_days_sort ON public.event_days (sort_order ASC, event_date ASC);

-- ---------------------------------------------------------------------------
-- 2. Add day_id column to time_slots (nullable, backward-compatible)
-- ---------------------------------------------------------------------------

ALTER TABLE public.time_slots
  ADD COLUMN IF NOT EXISTS day_id UUID REFERENCES public.event_days(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_time_slots_day_id ON public.time_slots (day_id);

-- ---------------------------------------------------------------------------
-- 3. RLS for event_days (admins only; participants access via SECURITY DEFINER RPCs)
-- ---------------------------------------------------------------------------

ALTER TABLE public.event_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to event_days" ON public.event_days;
CREATE POLICY "Admins have full access to event_days"
ON public.event_days FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

REVOKE ALL ON public.event_days FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_days TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Admin RPC: Get all days (ordered)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.admin_get_days();
CREATE OR REPLACE FUNCTION public.admin_get_days()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Organiser access required' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id',         d.id,
      'day_name',   d.day_name,
      'event_date', d.event_date,
      'sort_order', d.sort_order,
      'created_at', d.created_at,
      'slot_count', (SELECT count(*) FROM public.time_slots s WHERE s.day_id = d.id)
    ) ORDER BY d.sort_order ASC, d.event_date ASC
  ) INTO v_result
  FROM public.event_days d;

  RETURN coalesce(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_days() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_days() TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Admin RPC: Upsert a day (create or update)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.admin_upsert_day(uuid, text, date, integer);
CREATE OR REPLACE FUNCTION public.admin_upsert_day(
  p_id         uuid,
  p_day_name   text,
  p_event_date date,
  p_sort_order integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Organiser access required' USING ERRCODE = '42501';
  END IF;

  IF trim(p_day_name) = '' THEN
    RAISE EXCEPTION 'Day name cannot be empty' USING ERRCODE = '22023';
  END IF;

  IF p_id IS NULL THEN
    -- Create
    INSERT INTO public.event_days (day_name, event_date, sort_order)
    VALUES (trim(p_day_name), p_event_date, coalesce(p_sort_order, 0))
    RETURNING id INTO v_id;
    RETURN jsonb_build_object('success', true, 'message', 'Day created.', 'id', v_id);
  ELSE
    -- Update
    UPDATE public.event_days
    SET day_name   = trim(p_day_name),
        event_date = p_event_date,
        sort_order = coalesce(p_sort_order, 0)
    WHERE id = p_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'message', 'Day not found.');
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Day updated.', 'id', p_id);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_upsert_day(uuid, text, date, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_day(uuid, text, date, integer) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Admin RPC: Delete a day (slots become day-less, NOT deleted)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.admin_delete_day(uuid);
CREATE OR REPLACE FUNCTION public.admin_delete_day(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Organiser access required' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.event_days WHERE id = p_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Day not found.');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Day deleted. Its slots are now unassigned.');
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_day(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_day(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Update admin_get_slots_overview — include day info per slot
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.admin_get_slots_overview();
CREATE OR REPLACE FUNCTION public.admin_get_slots_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Organiser access required' USING ERRCODE = '42501';
  END IF;

  WITH slot_teams AS (
    SELECT
      s.id,
      s.slot_name,
      s.start_time,
      s.end_time,
      s.max_teams,
      s.is_ended,
      s.created_at,
      s.day_id,
      d.day_name,
      d.event_date,
      d.sort_order,
      count(b.id) AS booked_count,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'team_id',      t.team_id,
            'team_name',    t.team_name,
            'leader_email', t.leader_email,
            'booked_at',    b.booked_at
          ) ORDER BY b.booked_at ASC
        ) FILTER (WHERE b.id IS NOT NULL),
        '[]'::jsonb
      ) AS teams
    FROM public.time_slots s
    LEFT JOIN public.event_days d         ON d.id = s.day_id
    LEFT JOIN public.team_slot_bookings b ON b.slot_id = s.id
    LEFT JOIN public.teams t              ON t.team_id = b.team_id
    GROUP BY s.id, d.id
  )
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',           st.id,
        'slot_name',    st.slot_name,
        'start_time',   st.start_time,
        'end_time',     st.end_time,
        'max_teams',    st.max_teams,
        'is_ended',     st.is_ended,
        'created_at',   st.created_at,
        'day_id',       st.day_id,
        'day_name',     st.day_name,
        'event_date',   st.event_date,
        'sort_order',   st.sort_order,
        'booked_count', st.booked_count,
        'teams',        st.teams
      )
      ORDER BY
        coalesce(st.sort_order, 99999) ASC,
        coalesce(st.event_date, '9999-12-31'::date) ASC,
        st.start_time ASC,
        st.slot_name ASC
    ),
    '[]'::jsonb
  ) INTO v_result
  FROM slot_teams st;

  RETURN coalesce(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_slots_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_slots_overview() TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. Update get_public_time_slots — include day info (no max_teams leaked)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_public_time_slots(text, text);
CREATE OR REPLACE FUNCTION public.get_public_time_slots(p_team_id text, p_team_pin text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team      text := upper(trim(p_team_id));
  v_submitted boolean;
  v_slots     jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.teams
    WHERE team_id = v_team
      AND team_pin IS NOT NULL
      AND team_pin <> ''
      AND team_pin = trim(p_team_pin)
  ) THEN
    RAISE EXCEPTION 'Incorrect Team ID or PIN' USING ERRCODE = 'P0001';
  END IF;

  SELECT coalesce(bool_or(sub.submitted), false) INTO v_submitted
  FROM public.submissions sub
  WHERE sub.team_id = v_team;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id',         s.id,
      'slot_name',  s.slot_name,
      'start_time', s.start_time,
      'end_time',   s.end_time,
      'is_ended',   s.is_ended,
      'is_selected',(b.team_id IS NOT NULL),
      'day_id',     s.day_id,
      'day_name',   d.day_name,
      'event_date', d.event_date,
      'sort_order', d.sort_order,
      'status', CASE
        WHEN b.team_id IS NOT NULL        THEN 'selected'
        WHEN s.is_ended                   THEN 'ended'
        WHEN now() >= s.start_time        THEN 'ended'
        WHEN (SELECT count(*) FROM public.team_slot_bookings WHERE slot_id = s.id) >= s.max_teams
                                          THEN 'full'
        ELSE 'available'
      END,
      'can_select', (
        v_submitted
        AND NOT s.is_ended
        AND now() < s.start_time
        AND (SELECT count(*) FROM public.team_slot_bookings WHERE slot_id = s.id) < s.max_teams
        AND b.team_id IS NULL
      )
    ) ORDER BY
      coalesce(d.sort_order, 99999) ASC,
      coalesce(d.event_date, '9999-12-31'::date) ASC,
      s.start_time ASC,
      s.slot_name ASC
  ) INTO v_slots
  FROM public.time_slots s
  LEFT JOIN public.event_days d ON d.id = s.day_id
  LEFT JOIN public.team_slot_bookings b ON b.slot_id = s.id AND b.team_id = v_team;

  RETURN coalesce(v_slots, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_time_slots(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_time_slots(text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. Update get_team_slot_status — include day_name & event_date in booking
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_team_slot_status(text, text);
CREATE OR REPLACE FUNCTION public.get_team_slot_status(p_team_id text, p_team_pin text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team        text := upper(trim(p_team_id));
  v_team_row    record;
  v_booking     record;
  v_submitted   boolean;
BEGIN
  SELECT team_id, team_name INTO v_team_row
  FROM public.teams
  WHERE team_id = v_team
    AND team_pin IS NOT NULL
    AND team_pin <> ''
    AND team_pin = trim(p_team_pin);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('exists', false);
  END IF;

  -- Check if the team has an approved / submitted PPT
  SELECT coalesce(bool_or(s.submitted), false) INTO v_submitted
  FROM public.submissions s
  WHERE s.team_id = v_team;

  SELECT
    b.id          AS booking_id,
    b.slot_id,
    b.booked_at,
    s.slot_name,
    s.start_time,
    s.end_time,
    s.is_ended,
    s.day_id,
    d.day_name,
    d.event_date,
    (now() < s.start_time - INTERVAL '4 hours') AS can_change,
    round(extract(epoch from (s.start_time - now())) / 3600.0, 1) AS hours_until_start
  INTO v_booking
  FROM public.team_slot_bookings b
  JOIN public.time_slots s ON s.id = b.slot_id
  LEFT JOIN public.event_days d ON d.id = s.day_id
  WHERE b.team_id = v_team;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'exists',         true,
      'team_id',        v_team_row.team_id,
      'team_name',      v_team_row.team_name,
      'has_submitted',  v_submitted,
      'has_booking',    true,
      'booking', jsonb_build_object(
        'booking_id',       v_booking.booking_id,
        'slot_id',          v_booking.slot_id,
        'slot_name',        v_booking.slot_name,
        'start_time',       v_booking.start_time,
        'end_time',         v_booking.end_time,
        'booked_at',        v_booking.booked_at,
        'is_ended',         v_booking.is_ended,
        'day_id',           v_booking.day_id,
        'day_name',         v_booking.day_name,
        'event_date',       v_booking.event_date,
        'can_change',       v_booking.can_change,
        'hours_until_start', v_booking.hours_until_start
      )
    );
  ELSE
    RETURN jsonb_build_object(
      'exists',         true,
      'team_id',        v_team_row.team_id,
      'team_name',      v_team_row.team_name,
      'has_submitted',  v_submitted,
      'has_booking',    false,
      'booking',        null
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_team_slot_status(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_slot_status(text, text) TO anon, authenticated;

COMMIT;
