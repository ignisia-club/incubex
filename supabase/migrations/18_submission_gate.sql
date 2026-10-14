-- Migration 18: Submission Gate for Slot Selection
--
-- Only teams that have submitted their PPT (submissions.submitted = true)
-- are allowed to select time slots.
--
-- Changes:
--   1. get_team_slot_status  → adds has_submitted to the response
--   2. get_public_time_slots → can_select becomes false when not submitted
--   3. select_team_slot      → hard-blocks at DB level if not submitted
--
-- Safe to re-run (all CREATE OR REPLACE). One transaction.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. get_team_slot_status — adds has_submitted field
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
    (now() < s.start_time - INTERVAL '4 hours') AS can_change,
    round(extract(epoch from (s.start_time - now())) / 3600.0, 1) AS hours_until_start
  INTO v_booking
  FROM public.team_slot_bookings b
  JOIN public.time_slots s ON s.id = b.slot_id
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

-- ---------------------------------------------------------------------------
-- 2. get_public_time_slots — can_select = false when team has not submitted
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
  v_team       text := upper(trim(p_team_id));
  v_submitted  boolean;
  v_slots      jsonb;
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

  -- Determine submission status once
  SELECT coalesce(bool_or(s.submitted), false) INTO v_submitted
  FROM public.submissions s
  WHERE s.team_id = v_team;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id',          s.id,
      'slot_name',   s.slot_name,
      'start_time',  s.start_time,
      'end_time',    s.end_time,
      'is_ended',    s.is_ended,
      'is_selected', (b.team_id IS NOT NULL),
      'status', CASE
        WHEN b.team_id IS NOT NULL THEN 'selected'
        WHEN s.is_ended              THEN 'ended'
        WHEN now() >= s.start_time   THEN 'ended'
        WHEN (SELECT count(*) FROM public.team_slot_bookings WHERE slot_id = s.id) >= s.max_teams THEN 'full'
        ELSE 'available'
      END,
      -- can_select is false if the team has not submitted their PPT
      'can_select', (
        v_submitted
        AND NOT s.is_ended
        AND now() < s.start_time
        AND (SELECT count(*) FROM public.team_slot_bookings WHERE slot_id = s.id) < s.max_teams
        AND b.team_id IS NULL
      )
    ) ORDER BY s.start_time ASC, s.slot_name ASC
  ) INTO v_slots
  FROM public.time_slots s
  LEFT JOIN public.team_slot_bookings b
    ON b.slot_id = s.id AND b.team_id = v_team;

  RETURN coalesce(v_slots, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_time_slots(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_time_slots(text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. select_team_slot — hard-block at DB level if PPT not submitted
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.select_team_slot(text, text, uuid);
CREATE OR REPLACE FUNCTION public.select_team_slot(p_team_id text, p_team_pin text, p_slot_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team           text := upper(trim(p_team_id));
  v_target_slot    record;
  v_current_booking record;
  v_current_count  integer;
  v_submitted      boolean;
BEGIN
  -- 1. Verify credentials
  IF NOT EXISTS (
    SELECT 1 FROM public.teams
    WHERE team_id = v_team
      AND team_pin IS NOT NULL
      AND team_pin <> ''
      AND team_pin = trim(p_team_pin)
  ) THEN
    RAISE EXCEPTION 'Incorrect Team ID or PIN' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Gate: team must have submitted their PPT
  SELECT coalesce(bool_or(s.submitted), false) INTO v_submitted
  FROM public.submissions s
  WHERE s.team_id = v_team;

  IF NOT v_submitted THEN
    RAISE EXCEPTION 'Your team must submit its PPT before selecting a time slot.' USING ERRCODE = 'P0005';
  END IF;

  -- 3. Lock the target slot row to prevent concurrent race conditions
  SELECT * INTO v_target_slot
  FROM public.time_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Time slot not found' USING ERRCODE = '22023';
  END IF;

  -- 4. Check if target slot is ended or in the past
  IF v_target_slot.is_ended THEN
    RAISE EXCEPTION 'This time slot has ended and is closed for selection.' USING ERRCODE = 'P0002';
  END IF;

  IF now() >= v_target_slot.start_time THEN
    RAISE EXCEPTION 'This time slot has already started.' USING ERRCODE = 'P0002';
  END IF;

  -- 5. Check team's existing booking
  SELECT b.id, b.slot_id, s.start_time INTO v_current_booking
  FROM public.team_slot_bookings b
  JOIN public.time_slots s ON s.id = b.slot_id
  WHERE b.team_id = v_team;

  -- If already in this exact slot, no-op success
  IF FOUND AND v_current_booking.slot_id = p_slot_id THEN
    RETURN jsonb_build_object('success', true, 'message', 'You are already registered for this slot.');
  END IF;

  -- 6. Check capacity of target slot (after row-lock, count is stable)
  SELECT count(*) INTO v_current_count
  FROM public.team_slot_bookings
  WHERE slot_id = p_slot_id;

  IF v_current_count >= v_target_slot.max_teams THEN
    RAISE EXCEPTION 'This time slot is full. Please choose another available slot.' USING ERRCODE = 'P0004';
  END IF;

  -- 7. If changing from an existing slot, enforce the 4-hour rule on the OLD slot
  IF v_current_booking.id IS NOT NULL THEN
    IF now() >= v_current_booking.start_time - INTERVAL '4 hours' THEN
      RAISE EXCEPTION 'Cannot change slots within 4 hours of your currently scheduled slot.' USING ERRCODE = 'P0003';
    END IF;

    UPDATE public.team_slot_bookings
    SET slot_id = p_slot_id, updated_at = now()
    WHERE team_id = v_team;
  ELSE
    INSERT INTO public.team_slot_bookings (slot_id, team_id, booked_at)
    VALUES (p_slot_id, v_team, now());
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Slot selected successfully.');
END;
$$;

REVOKE ALL ON FUNCTION public.select_team_slot(text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.select_team_slot(text, text, uuid) TO anon, authenticated;

COMMIT;
