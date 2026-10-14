-- Migration 17: Time Slots & Atomic Team Slot Selection System
--
-- Features:
--   1. time_slots table (slot_name, start_time, end_time, max_teams default 0, is_ended default false)
--   2. team_slot_bookings table (unique per team_id, strictly enforces 1 slot per team)
--   3. Atomic select_team_slot with SELECT ... FOR UPDATE to eliminate race conditions
--   4. 4-hour cancellation / reselection lockout rule enforced in PostgreSQL
--   5. Participant RPC hides max_teams and numeric booking counts
--   6. Admin full access + admin management RPCs (view all enrolled teams, move/remove/assign, toggle ended)
--
-- Safe to re-run. One transaction: all of it applies, or none of it does.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Create Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.time_slots (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_name   TEXT NOT NULL,
    start_time  TIMESTAMPTZ NOT NULL,
    end_time    TIMESTAMPTZ NOT NULL,
    max_teams   INTEGER NOT NULL DEFAULT 0,
    is_ended    BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT time_slots_time_order CHECK (end_time > start_time),
    CONSTRAINT time_slots_max_teams_nonneg CHECK (max_teams >= 0)
);

CREATE TABLE IF NOT EXISTS public.team_slot_bookings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id     UUID NOT NULL REFERENCES public.time_slots(id) ON DELETE CASCADE,
    team_id     TEXT NOT NULL REFERENCES public.teams(team_id) ON DELETE CASCADE,
    booked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT team_slot_bookings_team_id_key UNIQUE (team_id)
);

CREATE INDEX IF NOT EXISTS idx_team_slot_bookings_slot_id ON public.team_slot_bookings (slot_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_start_time ON public.time_slots (start_time ASC);

-- ---------------------------------------------------------------------------
-- 2. Row Level Security (RLS)
-- ---------------------------------------------------------------------------

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_slot_bookings ENABLE ROW LEVEL SECURITY;

-- Admins have full direct CRUD access
DROP POLICY IF EXISTS "Admins have full access to time_slots" ON public.time_slots;
CREATE POLICY "Admins have full access to time_slots"
ON public.time_slots FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to team_slot_bookings" ON public.team_slot_bookings;
CREATE POLICY "Admins have full access to team_slot_bookings"
ON public.team_slot_bookings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Revoke direct table access from public / anon to protect max_teams and team lists
REVOKE ALL ON public.time_slots FROM PUBLIC, anon;
REVOKE ALL ON public.team_slot_bookings FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_slot_bookings TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Participant RPC: Check Team Credentials & Current Booking Status
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
  v_team text := upper(trim(p_team_id));
  v_team_row record;
  v_booking record;
BEGIN
  SELECT team_id, team_name INTO v_team_row
  FROM public.teams
  WHERE team_id = v_team AND team_pin IS NOT NULL AND team_pin <> '' AND team_pin = trim(p_team_pin);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('exists', false);
  END IF;

  SELECT 
    b.id AS booking_id,
    b.slot_id,
    b.booked_at,
    s.slot_name,
    s.start_time,
    s.end_time,
    s.is_ended,
    (now() < s.start_time - INTERVAL '4 hours') AS can_change,
    round(extract(epoch from (s.start_time - now())) / 3600.0, 1) AS hours_until_start
  INTO v_booking
  FROM public.team_slot_bookings b
  JOIN public.time_slots s ON s.id = b.slot_id
  WHERE b.team_id = v_team;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'exists', true,
      'team_id', v_team_row.team_id,
      'team_name', v_team_row.team_name,
      'has_booking', true,
      'booking', jsonb_build_object(
        'booking_id', v_booking.booking_id,
        'slot_id', v_booking.slot_id,
        'slot_name', v_booking.slot_name,
        'start_time', v_booking.start_time,
        'end_time', v_booking.end_time,
        'booked_at', v_booking.booked_at,
        'is_ended', v_booking.is_ended,
        'can_change', v_booking.can_change,
        'hours_until_start', v_booking.hours_until_start
      )
    );
  ELSE
    RETURN jsonb_build_object(
      'exists', true,
      'team_id', v_team_row.team_id,
      'team_name', v_team_row.team_name,
      'has_booking', false,
      'booking', null
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_team_slot_status(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_slot_status(text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Participant RPC: Get Public Available Slots (Hides max_teams & count)
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
  v_team text := upper(trim(p_team_id));
  v_slots jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.teams
    WHERE team_id = v_team AND team_pin IS NOT NULL AND team_pin <> '' AND team_pin = trim(p_team_pin)
  ) THEN
    RAISE EXCEPTION 'Incorrect Team ID or PIN' USING ERRCODE = 'P0001';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'slot_name', s.slot_name,
      'start_time', s.start_time,
      'end_time', s.end_time,
      'is_ended', s.is_ended,
      'is_selected', (b.team_id IS NOT NULL),
      'status', CASE
        WHEN b.team_id IS NOT NULL THEN 'selected'
        WHEN s.is_ended THEN 'ended'
        WHEN now() >= s.start_time THEN 'ended'
        WHEN (SELECT count(*) FROM public.team_slot_bookings WHERE slot_id = s.id) >= s.max_teams THEN 'full'
        ELSE 'available'
      END,
      'can_select', (
        NOT s.is_ended
        AND now() < s.start_time
        AND (SELECT count(*) FROM public.team_slot_bookings WHERE slot_id = s.id) < s.max_teams
        AND b.team_id IS NULL
      )
    ) ORDER BY s.start_time ASC, s.slot_name ASC
  ) INTO v_slots
  FROM public.time_slots s
  LEFT JOIN public.team_slot_bookings b ON b.slot_id = s.id AND b.team_id = v_team;

  RETURN coalesce(v_slots, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_time_slots(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_time_slots(text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Participant RPC: Select / Change Time Slot (Race-Condition Proof with FOR UPDATE)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.select_team_slot(text, text, uuid);
CREATE OR REPLACE FUNCTION public.select_team_slot(p_team_id text, p_team_pin text, p_slot_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team text := upper(trim(p_team_id));
  v_target_slot record;
  v_current_booking record;
  v_current_count integer;
BEGIN
  -- 1. Verify credentials
  IF NOT EXISTS (
    SELECT 1 FROM public.teams
    WHERE team_id = v_team AND team_pin IS NOT NULL AND team_pin <> '' AND team_pin = trim(p_team_pin)
  ) THEN
    RAISE EXCEPTION 'Incorrect Team ID or PIN' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Lock the target slot row to prevent concurrent race conditions
  SELECT * INTO v_target_slot
  FROM public.time_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Time slot not found' USING ERRCODE = '22023';
  END IF;

  -- 3. Check if target slot is ended or in the past
  IF v_target_slot.is_ended THEN
    RAISE EXCEPTION 'This time slot has ended and is closed for selection.' USING ERRCODE = 'P0002';
  END IF;

  IF now() >= v_target_slot.start_time THEN
    RAISE EXCEPTION 'This time slot has already started.' USING ERRCODE = 'P0002';
  END IF;

  -- 4. Check team's existing booking
  SELECT b.id, b.slot_id, s.start_time INTO v_current_booking
  FROM public.team_slot_bookings b
  JOIN public.time_slots s ON s.id = b.slot_id
  WHERE b.team_id = v_team;

  -- If already in this slot, no-op success
  IF FOUND AND v_current_booking.slot_id = p_slot_id THEN
    RETURN jsonb_build_object('success', true, 'message', 'You are already registered for this slot.');
  END IF;

  -- 5. Check capacity of target slot
  SELECT count(*) INTO v_current_count
  FROM public.team_slot_bookings
  WHERE slot_id = p_slot_id;

  IF v_current_count >= v_target_slot.max_teams THEN
    RAISE EXCEPTION 'This time slot is full. Please choose another available slot.' USING ERRCODE = 'P0004';
  END IF;

  -- 6. If changing from an existing slot, check the 4-hour rule on the OLD slot
  IF v_current_booking.id IS NOT NULL THEN
    IF now() >= v_current_booking.start_time - INTERVAL '4 hours' THEN
      RAISE EXCEPTION 'Cannot change slots within 4 hours of your currently scheduled slot.' USING ERRCODE = 'P0003';
    END IF;

    -- Update slot assignment
    UPDATE public.team_slot_bookings
    SET slot_id = p_slot_id, updated_at = now()
    WHERE team_id = v_team;
  ELSE
    -- Initial booking
    INSERT INTO public.team_slot_bookings (slot_id, team_id, booked_at)
    VALUES (p_slot_id, v_team, now());
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Slot selected successfully.');
END;
$$;

REVOKE ALL ON FUNCTION public.select_team_slot(text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.select_team_slot(text, text, uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Participant RPC: Cancel / Release Current Time Slot (Enforces 4-Hour Rule)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.cancel_team_slot(text, text);
CREATE OR REPLACE FUNCTION public.cancel_team_slot(p_team_id text, p_team_pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team text := upper(trim(p_team_id));
  v_booking record;
BEGIN
  -- 1. Verify credentials
  IF NOT EXISTS (
    SELECT 1 FROM public.teams
    WHERE team_id = v_team AND team_pin IS NOT NULL AND team_pin <> '' AND team_pin = trim(p_team_pin)
  ) THEN
    RAISE EXCEPTION 'Incorrect Team ID or PIN' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Fetch booking
  SELECT b.id, s.start_time INTO v_booking
  FROM public.team_slot_bookings b
  JOIN public.time_slots s ON s.id = b.slot_id
  WHERE b.team_id = v_team;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active time slot booking found.' USING ERRCODE = 'P0002';
  END IF;

  -- 3. Check 4-hour cutoff
  IF now() >= v_booking.start_time - INTERVAL '4 hours' THEN
    RAISE EXCEPTION 'Slot changes and cancellations are locked within 4 hours of the scheduled start time.' USING ERRCODE = 'P0003';
  END IF;

  -- 4. Delete booking
  DELETE FROM public.team_slot_bookings WHERE team_id = v_team;

  RETURN jsonb_build_object('success', true, 'message', 'Time slot booking cancelled successfully.');
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_team_slot(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_team_slot(text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Admin RPC: Get Full Slots Overview (Includes max_teams & enrolled teams)
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

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'slot_name', s.slot_name,
      'start_time', s.start_time,
      'end_time', s.end_time,
      'max_teams', s.max_teams,
      'is_ended', s.is_ended,
      'created_at', s.created_at,
      'booked_count', count(b.id),
      'teams', coalesce(
        jsonb_agg(
          jsonb_build_object(
            'team_id', t.team_id,
            'team_name', t.team_name,
            'leader_email', t.leader_email,
            'booked_at', b.booked_at
          ) ORDER BY b.booked_at ASC
        ) FILTER (WHERE b.id IS NOT NULL),
        '[]'::jsonb
      )
    ) ORDER BY s.start_time ASC, s.slot_name ASC
  ) INTO v_result
  FROM public.time_slots s
  LEFT JOIN public.team_slot_bookings b ON b.slot_id = s.id
  LEFT JOIN public.teams t ON t.team_id = b.team_id
  GROUP BY s.id;

  RETURN coalesce(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_slots_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_slots_overview() TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. Admin RPC: Assign or Move a Team to a Slot (Admin Override)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.admin_assign_team_slot(text, uuid);
CREATE OR REPLACE FUNCTION public.admin_assign_team_slot(p_team_id text, p_slot_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team text := upper(trim(p_team_id));
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Organiser access required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE team_id = v_team) THEN
    RAISE EXCEPTION 'Team % does not exist', v_team USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.time_slots WHERE id = p_slot_id) THEN
    RAISE EXCEPTION 'Time slot not found' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.team_slot_bookings (slot_id, team_id, booked_at, updated_at)
  VALUES (p_slot_id, v_team, now(), now())
  ON CONFLICT (team_id)
  DO UPDATE SET slot_id = EXCLUDED.slot_id, updated_at = now();

  RETURN jsonb_build_object('success', true, 'message', 'Team successfully assigned to slot.');
END;
$$;

REVOKE ALL ON FUNCTION public.admin_assign_team_slot(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_assign_team_slot(text, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 9. Admin RPC: Remove Team from Slot
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.admin_remove_team_slot(text);
CREATE OR REPLACE FUNCTION public.admin_remove_team_slot(p_team_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team text := upper(trim(p_team_id));
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Organiser access required' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.team_slot_bookings WHERE team_id = v_team;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'No booking found for this team.');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Team removed from slot.');
END;
$$;

REVOKE ALL ON FUNCTION public.admin_remove_team_slot(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_remove_team_slot(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 10. Admin RPC: Toggle Slot Ended Status
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.admin_toggle_slot_ended(uuid, boolean);
CREATE OR REPLACE FUNCTION public.admin_toggle_slot_ended(p_slot_id uuid, p_is_ended boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Organiser access required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.time_slots
  SET is_ended = p_is_ended
  WHERE id = p_slot_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Time slot not found.');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Slot status updated successfully.');
END;
$$;

REVOKE ALL ON FUNCTION public.admin_toggle_slot_ended(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_toggle_slot_ended(uuid, boolean) TO authenticated;

COMMIT;
