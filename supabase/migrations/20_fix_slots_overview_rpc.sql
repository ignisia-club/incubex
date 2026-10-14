-- Migration 20: Fix admin_get_slots_overview nested aggregate error
--
-- Fixes PostgreSQL error 42803: "aggregate function calls cannot be nested"
-- by using a CTE (subquery) to aggregate enrolled teams per slot first,
-- and then aggregating all slots into the final jsonb array.
--
-- Safe to re-run.

BEGIN;

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

COMMIT;
