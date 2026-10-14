import React, { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import {
  Clock, AlertCircle, Loader2, ArrowRight, CheckCircle2,
  Lock, Calendar, RefreshCw, X, ChevronRight, FileWarning
} from 'lucide-react';
import PortalShell from '../components/PortalShell.jsx';

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const TEAM_ID_PATTERN = /^(INC-\d{5}|\d{4,5})$/;

/** Format a UTC ISO string to IST locale string */
const toIST = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

/** Short time-only (IST) */
const timeIST = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

/** Date only (IST) */
const dateIST = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/** Group slots strictly by day (unassigned slots are never shown) */
const groupByDayOrDate = (slots) => {
  const groups = {};
  slots.forEach((slot) => {
    if (!slot.day_id || !slot.day_name) return; // Strictly ignore unassigned slots
    const key = `day-${slot.day_id}`;
    const label = slot.day_name;
    const d = slot.event_date ? new Date(slot.event_date + 'T00:00:00') : new Date(slot.start_time);
    const sublabel = d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    if (!groups[key]) {
      groups[key] = { key, label, sublabel, slots: [] };
    }
    groups[key].slots.push(slot);
  });
  return Object.values(groups);
};

/* ─────────────────────────────────────────────────────────────
   Status pill config
───────────────────────────────────────────────────────────── */
const PILL = {
  available:  { cls: 'portal-pill--open',   label: 'Available' },
  full:       { cls: 'portal-pill--full',   label: 'Full' },
  ended:      { cls: 'portal-pill--ended',  label: 'Ended' },
  selected:   { cls: 'portal-pill--yours',  label: 'Your Selection' },
};

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
export default function Slots() {
  /* ── Auth phase ─────────────────────── */
  const [teamId,  setTeamId]  = useState('');
  const [teamPin, setTeamPin] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  /* ── Dashboard phase ────────────────── */
  const [authed,     setAuthed]     = useState(false);
  const [teamInfo,   setTeamInfo]   = useState(null);   // { team_id, team_name, has_booking, booking }
  const [slots,      setSlots]      = useState([]);
  const [dashBusy,   setDashBusy]   = useState(false);
  const [dashError,  setDashError]  = useState('');
  const [dashOk,     setDashOk]     = useState('');

  /* ── Confirmation dialog ────────────── */
  const [confirm,    setConfirm]    = useState(null);   // { type: 'select'|'cancel', slot? }
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError,setActionError]= useState('');

  /* ─────────────────────────────────────
     Auth: verify Team ID + PIN
  ───────────────────────────────────── */
  const handleAuth = async (e) => {
    e.preventDefault();
    const id = teamId.trim().toUpperCase();
    if (!TEAM_ID_PATTERN.test(id)) {
      setAuthError('Enter your Team ID, e.g. 1003 or INC-12345.');
      return;
    }
    if (teamPin.trim().length !== 8) {
      setAuthError('Your Team PIN is 8 digits.');
      return;
    }

    setAuthBusy(true);
    setAuthError('');

    try {
      const { data, error } = await supabase.rpc('get_team_slot_status', {
        p_team_id: id,
        p_team_pin: teamPin.trim(),
      });

      if (error) throw new Error('Could not verify your team right now. Please try again.');
      if (!data?.exists) throw new Error('Incorrect Team ID or PIN. Please check and try again.');

      setTeamInfo(data);
      await loadSlots(id, teamPin.trim(), data);
      setAuthed(true);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthBusy(false);
    }
  };

  /* ─────────────────────────────────────
     Load available slots list
  ───────────────────────────────────── */
  const loadSlots = useCallback(async (tid, pin, currentInfo) => {
    try {
      const { data, error } = await supabase.rpc('get_public_time_slots', {
        p_team_id: tid ?? teamId.trim().toUpperCase(),
        p_team_pin: pin ?? teamPin.trim(),
      });
      if (error) throw error;
      setSlots(data ?? []);
      if (currentInfo !== undefined) setTeamInfo(currentInfo);
    } catch {
      /* non-fatal: dashboard stays visible */
    }
  }, [teamId, teamPin]);

  /* ─────────────────────────────────────
     Refresh dashboard data
  ───────────────────────────────────── */
  const refreshDashboard = async () => {
    setDashBusy(true);
    setDashError('');
    setDashOk('');
    try {
      const id  = teamId.trim().toUpperCase();
      const pin = teamPin.trim();
      const { data, error } = await supabase.rpc('get_team_slot_status', {
        p_team_id: id,
        p_team_pin: pin,
      });
      if (error) throw error;
      setTeamInfo(data);
      await loadSlots(id, pin, undefined);
    } catch {
      setDashError('Could not refresh. Please try again.');
    } finally {
      setDashBusy(false);
    }
  };

  /* ─────────────────────────────────────
     Select a slot (open confirm dialog)
  ───────────────────────────────────── */
  const openSelectConfirm = (slot) => {
    setActionError('');
    setConfirm({ type: 'select', slot });
  };

  /* ─────────────────────────────────────
     Cancel booking (open confirm dialog)
  ───────────────────────────────────── */
  const openCancelConfirm = () => {
    setActionError('');
    setConfirm({ type: 'cancel' });
  };

  /* ─────────────────────────────────────
     Confirm action (select / cancel)
  ───────────────────────────────────── */
  const handleConfirm = async () => {
    setActionBusy(true);
    setActionError('');
    const id  = teamId.trim().toUpperCase();
    const pin = teamPin.trim();

    try {
      if (confirm.type === 'select') {
        const { data, error } = await supabase.rpc('select_team_slot', {
          p_team_id: id,
          p_team_pin: pin,
          p_slot_id: confirm.slot.id,
        });
        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.message ?? 'Could not book this slot. Please try again.');
        setDashOk(`Successfully booked: ${confirm.slot.slot_name}`);
      } else {
        const { data, error } = await supabase.rpc('cancel_team_slot', {
          p_team_id: id,
          p_team_pin: pin,
        });
        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.message ?? 'Could not cancel your booking. Please try again.');
        setDashOk('Your slot booking has been cancelled.');
      }

      setConfirm(null);

      /* Re-fetch both status + slots */
      const { data: refreshed } = await supabase.rpc('get_team_slot_status', {
        p_team_id: id,
        p_team_pin: pin,
      });
      if (refreshed) setTeamInfo(refreshed);
      await loadSlots(id, pin, undefined);
    } catch (err) {
      setActionError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setActionBusy(false);
    }
  };

  /* ─────────────────────────────────────
     Render: Auth form
  ───────────────────────────────────── */
  if (!authed) {
    return (
      <PortalShell hero>
        <header className="portal-head">
          <span className="portal-wordmark" aria-label="INCUBEX">INCUBE<span>X</span></span>
          <h1 className="portal-title">Pitch Time Slot Selection</h1>
          <p className="portal-sub">Enter your Team ID and PIN to view and book your slot.</p>
        </header>

        <div className="portal-card">
          <form className="portal-form" onSubmit={handleAuth} noValidate aria-busy={authBusy}>
            <div className="portal-field">
              <label className="portal-label" htmlFor="slot-team-id">Team ID</label>
              <input
                id="slot-team-id"
                className="portal-input portal-input--id"
                type="text"
                autoComplete="off"
                spellCheck="false"
                maxLength={9}
                placeholder="e.g. 1003"
                value={teamId}
                onChange={(e) => { setTeamId(e.target.value.toUpperCase()); setAuthError(''); }}
                disabled={authBusy}
                required
              />
            </div>

            <div className="portal-field">
              <label className="portal-label" htmlFor="slot-team-pin">Team PIN</label>
              <input
                id="slot-team-pin"
                className="portal-input portal-input--id"
                type="text"
                autoComplete="off"
                spellCheck="false"
                maxLength={8}
                placeholder="8-digit PIN"
                value={teamPin}
                onChange={(e) => { setTeamPin(e.target.value); setAuthError(''); }}
                disabled={authBusy}
                required
              />
            </div>

            {authError && (
              <div className="portal-alert portal-alert--error" role="alert">
                <AlertCircle size={18} />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="portal-btn portal-btn--block"
              disabled={authBusy || !teamId || !teamPin}
            >
              {authBusy
                ? <><Loader2 size={18} className="portal-spin" /> Verifying…</>
                : <>View Slots <ArrowRight size={18} /></>
              }
            </button>
          </form>
        </div>

        {/* ── Tentative schedule notice ── */}
        <div
          style={{
            marginTop: '1.25rem',
            padding: '14px 18px',
            borderRadius: '16px',
            background: 'rgba(238, 242, 255, 0.75)',
            border: '1px solid #c7d2fe',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            textAlign: 'left',
          }}
        >
          <Clock size={18} style={{ color: '#4338ca', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.83rem', color: '#312e81', lineHeight: 1.5 }}>
            <strong style={{ color: '#1e1b4b', display: 'block', marginBottom: '2px' }}>Important Schedule Notice:</strong>
            Presentation slots are tentative and subject to variations of approximately ±1 hour depending on live jury evaluations, team presentations, and event pacing. Teams are requested to report to the venue and remain on standby well in advance of their scheduled window.
          </div>
        </div>
      </PortalShell>
    );
  }

  /* ─────────────────────────────────────
     Render: Dashboard
  ───────────────────────────────────── */
  const booking      = teamInfo?.booking ?? null;
  const hasSubmitted = teamInfo?.has_submitted ?? false;
  const dateGroups = groupByDayOrDate(slots);

  return (
    <PortalShell hero>
      {/* ── Top bar ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '1.5rem' }}>
        <div>
          <span className="portal-wordmark" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }} aria-label="INCUBEX">INCUBE<span>X</span></span>
          <p className="portal-sub" style={{ marginTop: '4px' }}>
            <strong>{teamInfo?.team_name ?? teamId}</strong>
            <span style={{ color: 'var(--p-muted)', marginLeft: '8px', fontVariantNumeric: 'tabular-nums' }}>
              {teamInfo?.team_id ?? teamId}
            </span>
          </p>
        </div>
        <button
          type="button"
          className="portal-btn portal-btn--ghost portal-btn--sm"
          onClick={refreshDashboard}
          disabled={dashBusy}
          aria-label="Refresh slot data"
        >
          <RefreshCw size={15} className={dashBusy ? 'portal-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Global messages ── */}
      {dashError && (
        <div className="portal-alert portal-alert--error" role="alert" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={18} />
          <span>{dashError}</span>
        </div>
      )}
      {dashOk && (
        <div className="portal-alert portal-alert--ok" role="status" style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={18} />
          <span>{dashOk}</span>
          <button
            type="button"
            className="portal-notice-close"
            onClick={() => setDashOk('')}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Submission-required gate banner ── */}
      {!hasSubmitted && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            padding: '18px 20px',
            marginBottom: '1.5rem',
            background: 'rgba(255, 251, 235, 0.9)',
            border: '1px solid #fde68a',
            borderRadius: '16px',
            backdropFilter: 'blur(8px)',
          }}
          role="alert"
        >
          <FileWarning size={22} style={{ color: '#b45309', flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '0.95rem', color: '#92400e' }}>
              PPT submission required
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#b45309', lineHeight: 1.5 }}>
              Your team must submit its pitch deck before you can select a time slot.
              Head to the <a href="/upload" style={{ color: '#b45309', fontWeight: 700 }}>Upload page</a> to submit your deck, then come back here.
            </p>
          </div>
        </div>
      )}

      {/* ── Current booking banner ── */}
      {booking && (
        <div className="portal-card" style={{ marginBottom: '1.5rem', borderColor: '#c4b5fd', background: 'rgba(237,233,254,0.6)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <p className="portal-muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Your Current Booking
              </p>
              <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '1.05rem', color: 'var(--p-ink)' }}>
                {booking.day_name && (
                  <span style={{ color: 'var(--p-blue)', marginRight: '6px' }}>{booking.day_name} ·</span>
                )}
                {booking.slot_name}
              </p>
              <p style={{ margin: 0, color: 'var(--p-copy)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} />
                {toIST(booking.start_time)} – {timeIST(booking.end_time)}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
              {booking.can_change ? (
                <>
                  <button
                    type="button"
                    className="portal-btn portal-btn--ghost portal-btn--sm"
                    onClick={openCancelConfirm}
                    disabled={dashBusy}
                  >
                    <X size={14} />
                    Cancel Booking
                  </button>
                  <p className="portal-muted" style={{ fontSize: '0.75rem', textAlign: 'right', margin: 0 }}>
                    Select another slot below to change.
                  </p>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--p-muted)', fontSize: '0.8rem', maxWidth: '200px', textAlign: 'right' }}>
                  <Lock size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Locked — slot starts in less than 4 hours. Contact the organisers to change.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tentative schedule notice banner ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
          padding: '14px 18px',
          marginBottom: '1.25rem',
          background: 'rgba(238, 242, 255, 0.85)',
          border: '1px solid #c7d2fe',
          borderRadius: '16px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Clock size={20} style={{ color: '#4338ca', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{ margin: '0 0 3px', fontWeight: 800, fontSize: '0.9rem', color: '#1e1b4b' }}>
            Important Schedule Notice
          </p>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#312e81', lineHeight: 1.5 }}>
            All presentation time slots are tentative and subject to variations of approximately ±1 hour depending on jury proceedings, live evaluation dynamics, and event pacing. Teams are requested to report to the venue and remain on standby well in advance of their scheduled window.
          </p>
        </div>
      </div>

      {/* ── Slot list ── */}
      <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--p-line-soft)' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--p-ink)' }}>
            Available Time Slots
          </h2>
          <p className="portal-muted" style={{ margin: '3px 0 0', fontSize: '0.82rem' }}>
            Slots are first-come, first-served. You may only hold one slot at a time.
          </p>
        </div>

        {dashBusy && slots.length === 0 ? (
          <div className="portal-loading" style={{ minHeight: '180px' }}>
            <Loader2 size={28} className="portal-spin" />
          </div>
        ) : slots.length === 0 ? (
          <p className="portal-empty">No time slots have been published yet.</p>
        ) : (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {dateGroups.map((group) => (
              <div key={group.key || group.label}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '0 0 8px', flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: 'var(--p-navy)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {group.label}
                  </p>
                  {group.sublabel && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--p-muted)', fontWeight: 600 }}>
                      {group.sublabel}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {group.slots.map((slot) => {
                    const isYours   = slot.status === 'selected';
                    const pill      = PILL[slot.status] ?? PILL.available;
                    const canSelect = hasSubmitted && slot.can_select && !isYours;

                    return (
                      <div
                        key={slot.id}
                        className="portal-slot-team-item"
                        style={{
                          background: isYours ? 'rgba(237,233,254,0.55)' : '#fff',
                          borderColor: isYours ? '#c4b5fd' : 'var(--p-line-soft)',
                        }}
                      >
                        {/* Slot info */}
                        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                          <p style={{ margin: '0 0 3px', fontWeight: 700, color: 'var(--p-ink)', fontSize: '0.95rem' }}>
                            {slot.slot_name}
                          </p>
                          <p style={{ margin: 0, color: 'var(--p-copy)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={12} />
                            {timeIST(slot.start_time)} – {timeIST(slot.end_time)}
                          </p>
                        </div>

                        {/* Right side: pill + action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          <span
                            className={`portal-pill ${pill.cls}`}
                            style={isYours ? { background: '#ede9fe', color: '#5b21b6', borderColor: '#c4b5fd' } : {}}
                          >
                            {isYours && <CheckCircle2 size={11} />}
                            {pill.label}
                          </span>

                          {canSelect && (
                            <button
                              type="button"
                              className="portal-btn portal-btn--sm"
                              style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.82rem' }}
                              onClick={() => openSelectConfirm(slot)}
                              disabled={dashBusy}
                            >
                              Select <ChevronRight size={14} />
                            </button>
                          )}

                          {/* Already selected — show "change" hint only when unlocked */}
                          {isYours && booking?.can_change && (
                            <span className="portal-muted" style={{ fontSize: '0.75rem' }}>active</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Confirmation modal ── */}
      {confirm && (
        <div className="portal-modal-backdrop" role="dialog" aria-modal="true">
          <div className="portal-modal">
            <h2 className="portal-modal-title">
              {confirm.type === 'select' ? 'Confirm Slot Selection' : 'Cancel Your Booking'}
            </h2>

            {confirm.type === 'select' ? (
              <div style={{ marginBottom: '18px' }}>
                <p style={{ margin: '0 0 6px', color: 'var(--p-copy)', fontSize: '0.9rem' }}>
                  You are about to book:
                </p>
                <div className="portal-card" style={{ padding: '14px 18px', background: 'rgba(237,233,254,0.5)', borderColor: '#c4b5fd' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 800, color: 'var(--p-ink)' }}>
                    {confirm.slot.day_name && (
                      <span style={{ color: 'var(--p-blue)', marginRight: '6px' }}>{confirm.slot.day_name} ·</span>
                    )}
                    {confirm.slot.slot_name}
                  </p>
                  <p style={{ margin: 0, color: 'var(--p-copy)', fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Calendar size={13} />
                    {toIST(confirm.slot.start_time)} – {timeIST(confirm.slot.end_time)}
                  </p>
                </div>
                {teamInfo?.has_booking && (
                  <p className="portal-alert portal-alert--error" role="note" style={{ marginTop: '12px' }}>
                    <AlertCircle size={16} />
                    <span>This will <strong>replace</strong> your current booking.</span>
                  </p>
                )}
                <p style={{ margin: '10px 0 0', fontSize: '0.8rem', color: '#4338ca', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} style={{ flexShrink: 0 }} />
                  <span>Note: Timings are tentative and subject to ~±1 hr variation based on jury evaluations.</span>
                </p>
              </div>
            ) : (
              <p style={{ margin: '0 0 18px', color: 'var(--p-copy)', fontSize: '0.9rem' }}>
                Are you sure you want to cancel your booking for{' '}
                <strong>{booking?.slot_name}</strong>? You can re-book any available slot afterwards.
              </p>
            )}

            {actionError && (
              <div className="portal-alert portal-alert--error" role="alert" style={{ marginBottom: '14px' }}>
                <AlertCircle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <div className="portal-modal-actions">
              <button
                type="button"
                className="portal-btn portal-btn--ghost portal-btn--sm"
                onClick={() => { setConfirm(null); setActionError(''); }}
                disabled={actionBusy}
              >
                Go Back
              </button>
              <button
                type="button"
                className={`portal-btn portal-btn--sm${confirm.type === 'cancel' ? '' : ''}`}
                style={confirm.type === 'cancel' ? { background: '#be123c' } : {}}
                onClick={handleConfirm}
                disabled={actionBusy}
              >
                {actionBusy
                  ? <><Loader2 size={16} className="portal-spin" /> Working…</>
                  : confirm.type === 'select'
                    ? <>Confirm Booking <CheckCircle2 size={15} /></>
                    : <>Yes, Cancel It</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
