import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { Loader2, LogOut, X, RefreshCw, AlertCircle, ArrowRight, Download, Trash2, Search, Users, CheckCircle2, FileSpreadsheet, History, ChevronDown, Clock, Plus, Edit2, UserPlus, UserMinus, ArrowRightLeft, Lock, Unlock, ChevronUp, Calendar, CalendarDays, FolderOpen } from 'lucide-react';
import * as XLSX from 'xlsx';
import PortalShell from '../components/PortalShell.jsx';
import { SLOTS_ENABLED } from '../features.js';

// Maps a ppt_backups row (or its absence) to a label + dot colour.
function backupInfo(backup) {
  if (!backup) return { label: 'Backup not started', mod: 'none', title: 'No backup record yet. The webhook may not have fired; the 2-hourly sweep will pick it up.' };
  if (backup.status === 'success') return { label: 'Backed up', mod: 'success', title: `Backed up to B2 as ${backup.backup_key}` };
  if (backup.status === 'failed') return { label: 'Backup failed', mod: 'failed', title: `Backup failed: ${backup.error || 'it will be retried by the next sweep.'}` };
  return { label: 'Backup pending', mod: 'pending', title: 'Backup in progress' };
}

// Evaluation (marks, results) lives in Club OS; here it's only who has uploaded.
const FILTERS = [
  ['all', 'All'],
  ['submitted', 'Submitted'],
  ['not_submitted', 'Not submitted'],
];

// Team IDs: the original INC-12345 format, or a Club OS team number (4-5 digits, leading zeros kept).
const TEAM_ID_RE = /^(INC-\d{5}|\d{4,5})$/;
const NEEDS_MIGRATION = 'Adding and removing teams needs database migration 11 (supabase/migrations/11_admin_team_management.sql). Run it in the Supabase SQL editor, then try again.';

// "1003" or "1003, leader@college.edu" per line (comma, tab or semicolon). Returns valid rows + rejected lines.
function parseTeamLines(text) {
  const rows = new Map();
  const rejected = [];
  text.split(/\r?\n/).forEach((line) => {
    const raw = line.trim();
    if (!raw) return;
    const [idPart = '', emailPart = ''] = raw.split(/[,;\t]/).map((x) => x.trim());
    const id = idPart.toUpperCase();
    if (!TEAM_ID_RE.test(id)) { rejected.push(raw); return; }
    rows.set(id, { team_id: id, ...(emailPart.includes('@') ? { leader_email: emailPart.toLowerCase() } : {}) });
  });
  return { rows: [...rows.values()], rejected };
}

const formatWhen = (iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

// Reads the first sheet of an .xlsx/.xls/.csv file into "id" / "id, email" lines for the Add teams box.
// Uses a header row if present (a column named like "Team ID"/"ID" and one like "Email"); otherwise
// column A is the ID and the email is whichever other column contains an "@".
async function parseTeamSheet(file) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
    .map((row) => row.map((cell) => String(cell ?? '').trim()));
  if (grid.length === 0) return [];

  const head = grid[0].map((cell) => cell.toLowerCase());
  let idCol = head.findIndex((h) => /team\s*_?\s*(id|no|number|code)|^id$|^team$/.test(h));
  let emailCol = head.findIndex((h) => /e-?mail/.test(h));
  const hasHeader = idCol !== -1 || emailCol !== -1;
  const body = hasHeader ? grid.slice(1) : grid;
  if (idCol === -1) idCol = 0;
  if (emailCol === -1) {
    const width = Math.max(0, ...body.map((row) => row.length));
    for (let c = 0; c < width; c++) {
      if (c !== idCol && body.some((row) => (row[c] || '').includes('@'))) { emailCol = c; break; }
    }
  }

  return body
    .map((row) => {
      const id = (row[idCol] || '').toUpperCase();
      const mail = emailCol === -1 ? '' : (row[emailCol] || '');
      if (!id) return '';
      return mail.includes('@') ? `${id}, ${mail.toLowerCase()}` : id;
    })
    .filter(Boolean);
}

const toDateTimeLocal = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatSlotWindow = (startIso, endIso) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dateStr = start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const startTimeStr = start.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  const endTimeStr = end.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${dateStr} · ${startTimeStr} – ${endTimeStr}`;
};

export default function Admin() {
  const [session, setSession] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const authGeneration = useRef(0);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  // Tab State: 'submissions' or 'slots'
  const [activeTab, setActiveTab] = useState('submissions');

  // Upload Portal Toggle State
  const [uploadEnabled, setUploadEnabled] = useState(true);
  const [togglingUpload, setTogglingUpload] = useState(false);

  // Submissions State
  const [submissions, setSubmissions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // all | submitted | not_submitted
  const [expanded, setExpanded] = useState(() => new Set()); // teams showing their earlier uploads
  const [query, setQuery] = useState('');
  const [backupsAvailable, setBackupsAvailable] = useState(false);

  // Time Slots State
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [expandedSlots, setExpandedSlots] = useState(() => new Set());
  const [slotModal, setSlotModal] = useState(null); // null | { mode: 'create' | 'edit', slot?: any }
  const [slotName, setSlotName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxTeams, setMaxTeams] = useState(0);
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState('');

  // Team management in slots modals
  const [moveModal, setMoveModal] = useState(null); // null | { teamId, teamName, currentSlotId }
  const [targetMoveSlotId, setTargetMoveSlotId] = useState('');
  const [addTeamModal, setAddTeamModal] = useState(null); // null | { slotId, slotName }
  const [manualAddTeamId, setManualAddTeamId] = useState('');

  // Event Days state
  const [days, setDays] = useState([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [dayModal, setDayModal] = useState(null); // null | { mode: 'create'|'edit', day? }
  const [dayName, setDayName] = useState('');
  const [dayDate, setDayDate] = useState('');
  const [daySortOrder, setDaySortOrder] = useState(0);
  const [dayModalBusy, setDayModalBusy] = useState(false);
  const [dayModalError, setDayModalError] = useState('');
  // Selected day_id when creating/editing a slot
  const [slotDayId, setSlotDayId] = useState('');

  const [teamsOpen, setTeamsOpen] = useState(false);
  const [teamsText, setTeamsText] = useState('');
  const [teamsBusy, setTeamsBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { kind: 'ok' | 'error', text }
  const importFileRef = useRef(null);

  // Fills the Add teams box from a spreadsheet. Nothing is saved until the organiser clicks Add.
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const lines = await parseTeamSheet(file);
      if (lines.length === 0) {
        setNotice({ kind: 'error', text: `No Team IDs found in ${file.name}. Put IDs in the first column (or a column named "Team ID"), emails optional.` });
        return;
      }
      setTeamsText((prev) => {
        const existing = prev.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const seen = new Set(existing.map((l) => l.split(/[,;\t]/)[0].trim().toUpperCase()));
        const added = lines.filter((l) => {
          const id = l.split(',')[0].trim();
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        return [...existing, ...added].join('\n');
      });
      setNotice({ kind: 'ok', text: `Imported ${lines.length} row${lines.length === 1 ? '' : 's'} from ${file.name}. Review the list, then click Add.` });
    } catch {
      setNotice({ kind: 'error', text: `Couldn't read ${file.name}. Use an .xlsx, .xls or .csv file.` });
    }
  };

  const runAction = async (action) => {
    try { await action(); }
    catch { setNotice({ kind: 'error', text: 'This action could not finish. Refresh to check its status before trying again.' }); }
  };

  useEffect(() => {
    let active = true;
    const verifyAccess = async (nextSession) => {
      const generation = ++authGeneration.current;
      setLoading(true);
      setAuthorized(false);
      setSession(nextSession);
      setSubmissions([]);
      try {
        if (nextSession) {
          const { data, error } = await supabase.rpc('is_admin');
          if (!active || generation !== authGeneration.current) return;
          if (error || data !== true) {
            setLoginError(error ? 'Unable to verify organiser access. Try signing in again.' : 'This account does not have organiser access.');
          } else {
            setAuthorized(true);
          }
        }
      } catch {
        if (active) setLoginError('Unable to verify organiser access. Try signing in again.');
      } finally {
        if (active && generation === authGeneration.current) setLoading(false);
      }
    };
    // Defer Supabase calls outside its auth callback to avoid holding the auth lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      queueMicrotask(() => { if (active) verifyAccess(nextSession); });
    });

    return () => { active = false; ++authGeneration.current; subscription.unsubscribe(); };
  }, []);

  const fetchUploadStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('get_upload_status');
      if (!error && typeof data === 'boolean') {
        setUploadEnabled(data);
      } else {
        const { data: row } = await supabase.from('app_settings').select('value').eq('key', 'upload_submissions').maybeSingle();
        if (row?.value?.enabled !== undefined) {
          setUploadEnabled(Boolean(row.value.enabled));
        }
      }
    } catch (err) {
      console.error('Failed to fetch upload status:', err);
    }
  };

  useEffect(() => {
    if (!authorized) return;
    fetchUploadStatus();
    if (activeTab === 'submissions') {
      fetchSubmissions();
      const timer = setInterval(() => {
        fetchSubmissions();
        fetchUploadStatus();
      }, 30000);
      return () => clearInterval(timer);
    } else if (activeTab === 'slots') {
      fetchSlots();
      const timer = setInterval(fetchSlots, 30000);
      return () => clearInterval(timer);
    }
  }, [authorized, activeTab]);

  const fetchSubmissions = async () => {
    const generation = authGeneration.current;
    setRefreshing(true);
    try {
    const { data, error } = await supabase
      .from('teams')
      .select('team_id, team_name, leader_email, created_at, submissions(id, ppt_url, submitted_at)')
      .order('created_at', { ascending: false });
    if (generation !== authGeneration.current) return;
    if (error) throw error;

    // Secondary (Backblaze B2) backup log, keyed by the storage path of each submitted deck.
    // If the table doesn't exist yet (migration 07 not run) we simply show no backup status.
    const { data: backupRows, error: backupError } = await supabase
      .from('ppt_backups')
      .select('source_path, status, backup_key, version, error');
    if (generation !== authGeneration.current) return;
    setBackupsAvailable(!backupError);
    const backupByPath = {};
    (backupRows || []).forEach(b => { backupByPath[b.source_path] = b; });

    if (data) {
      // A team may upload more than once: the newest upload counts, earlier ones are kept.
      const formatted = data.map(t => {
        const uploads = (Array.isArray(t.submissions) ? t.submissions : t.submissions ? [t.submissions] : [])
          .filter((u) => u.ppt_url)
          .map((u) => ({ id: u.id, ppt_url: u.ppt_url, submitted_at: u.submitted_at, backup: backupByPath[u.ppt_url] }))
          .sort((a, b) => (Date.parse(b.submitted_at || 0) || 0) - (Date.parse(a.submitted_at || 0) || 0));
        const latest = uploads[0];
        return {
          team_id: t.team_id,
          team_name: t.team_name,
          leader_email: t.leader_email,
          uploads,
          submitted: uploads.length > 0,
          state: uploads.length > 0 ? 'submitted' : 'not_submitted',
          ppt_url: latest?.ppt_url,
          submitted_at: latest?.submitted_at,
          backup: latest?.backup
        };
      });
      setSubmissions(formatted);
    }
    } catch {
      if (generation === authGeneration.current) setNotice({ kind: 'error', text: 'Could not load submissions. Please refresh and try again.' });
    } finally {
      if (generation === authGeneration.current) setRefreshing(false);
    }
  };

  const fetchSlots = async () => {
    setSlotsLoading(true);
    try {
      const [slotsRes, daysRes] = await Promise.all([
        supabase.rpc('admin_get_slots_overview'),
        supabase.rpc('admin_get_days'),
      ]);
      if (daysRes.data) setDays(daysRes.data);
      if (slotsRes.data) setSlots(slotsRes.data);

      if (slotsRes.error || daysRes.error) {
        const errMsg = slotsRes.error?.message || daysRes.error?.message;
        setNotice({ kind: 'error', text: `Error loading slots: ${errMsg}` });
      }
    } catch (err) {
      console.error(err);
      setNotice({ kind: 'error', text: err.message || 'Could not load time slots. Please refresh.' });
    } finally {
      setSlotsLoading(false);
    }
  };

  const openCreateSlotModal = (preselectedDayId) => {
    setSlotName('');
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    const end = new Date(now);
    end.setHours(end.getHours() + 1);
    setStartTime(toDateTimeLocal(now));
    setEndTime(toDateTimeLocal(end));
    setMaxTeams(0);
    setSlotDayId(typeof preselectedDayId === 'string' ? preselectedDayId : '');
    setModalError('');
    setSlotModal({ mode: 'create' });
  };

  const openEditSlotModal = (slot) => {
    setSlotName(slot.slot_name);
    setStartTime(toDateTimeLocal(slot.start_time));
    setEndTime(toDateTimeLocal(slot.end_time));
    setMaxTeams(slot.max_teams);
    setSlotDayId(slot.day_id ?? '');
    setModalError('');
    setSlotModal({ mode: 'edit', slot });
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!slotName.trim() || !startTime || !endTime) {
      setModalError('Please fill in all required fields.');
      return;
    }
    const startD = new Date(startTime);
    const endD = new Date(endTime);
    if (endD <= startD) {
      setModalError('End time must be after start time.');
      return;
    }
    setModalBusy(true);
    setModalError('');
    try {
      const payload = {
        slot_name: slotName.trim(),
        start_time: startD.toISOString(),
        end_time: endD.toISOString(),
        max_teams: Math.max(0, parseInt(maxTeams, 10) || 0),
        day_id: slotDayId || null,
      };

      if (slotModal.mode === 'create') {
        const { error } = await supabase.from('time_slots').insert(payload);
        if (error) throw error;
        setNotice({ kind: 'ok', text: 'Time slot created successfully.' });
      } else {
        const { error } = await supabase.from('time_slots').update(payload).eq('id', slotModal.slot.id);
        if (error) throw error;
        setNotice({ kind: 'ok', text: 'Time slot updated successfully.' });
      }
      setSlotModal(null);
      fetchSlots();
    } catch (err) {
      setModalError(err.message || 'Could not save slot.');
    } finally {
      setModalBusy(false);
    }
  };

  const handleToggleSlotEnded = async (slotId, currentEnded) => {
    try {
      const { data, error } = await supabase.rpc('admin_toggle_slot_ended', {
        p_slot_id: slotId,
        p_is_ended: !currentEnded
      });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);
      setNotice({ kind: 'ok', text: !currentEnded ? 'Slot ended and closed.' : 'Slot reopened.' });
      fetchSlots();
    } catch (err) {
      setNotice({ kind: 'error', text: err.message || 'Could not update slot status.' });
    }
  };

  const handleDeleteSlot = async (slot) => {
    const count = slot.booked_count || 0;
    const warning = count > 0 ? ` WARNING: ${count} team(s) booked in this slot will be unassigned!` : '';
    if (!window.confirm(`Delete slot "${slot.slot_name}"?${warning}`)) return;
    try {
      const { error } = await supabase.from('time_slots').delete().eq('id', slot.id);
      if (error) throw error;
      setNotice({ kind: 'ok', text: `Slot "${slot.slot_name}" deleted.` });
      fetchSlots();
    } catch (err) {
      setNotice({ kind: 'error', text: err.message || 'Could not delete slot.' });
    }
  };

  const handleRemoveTeamFromSlot = async (teamId) => {
    if (!window.confirm(`Remove team ${teamId} from this slot?`)) return;
    try {
      const { data, error } = await supabase.rpc('admin_remove_team_slot', { p_team_id: teamId });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);
      setNotice({ kind: 'ok', text: `Team ${teamId} removed from slot.` });
      fetchSlots();
    } catch (err) {
      setNotice({ kind: 'error', text: err.message || 'Could not remove team.' });
    }
  };

  const handleMoveTeam = async () => {
    if (!moveModal?.teamId || !targetMoveSlotId) return;
    try {
      const { data, error } = await supabase.rpc('admin_assign_team_slot', {
        p_team_id: moveModal.teamId,
        p_slot_id: targetMoveSlotId
      });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);
      setNotice({ kind: 'ok', text: `Team ${moveModal.teamId} moved successfully.` });
      setMoveModal(null);
      fetchSlots();
    } catch (err) {
      setNotice({ kind: 'error', text: err.message || 'Could not move team.' });
    }
  };

  const handleAddTeamToSlot = async (e) => {
    e.preventDefault();
    const cleanId = manualAddTeamId.trim().toUpperCase();
    if (!cleanId || !addTeamModal?.slotId) return;
    try {
      const { data, error } = await supabase.rpc('admin_assign_team_slot', {
        p_team_id: cleanId,
        p_slot_id: addTeamModal.slotId
      });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);
      setNotice({ kind: 'ok', text: `Team ${cleanId} assigned to slot.` });
      setAddTeamModal(null);
      setManualAddTeamId('');
      fetchSlots();
    } catch (err) {
      setNotice({ kind: 'error', text: err.message || 'Could not assign team.' });
    }
  };

  // ── Day CRUD handlers ────────────────────────────────────────────────────
  const handleOpenCreateDayModal = () => {
    setDayName('');
    setDayDate(new Date().toISOString().split('T')[0]);
    setDaySortOrder(days.length); // default sort = after existing days
    setDayModalError('');
    setDayModal({ mode: 'create' });
  };

  const handleOpenEditDayModal = (day) => {
    setDayName(day.day_name);
    setDayDate(day.event_date);
    setDaySortOrder(day.sort_order ?? 0);
    setDayModalError('');
    setDayModal({ mode: 'edit', day });
  };

  const handleSaveDay = async (e) => {
    e.preventDefault();
    if (!dayName.trim() || !dayDate) {
      setDayModalError('Day name and date are required.');
      return;
    }
    setDayModalBusy(true);
    setDayModalError('');
    try {
      const { data, error } = await supabase.rpc('admin_upsert_day', {
        p_id:         dayModal.mode === 'edit' ? dayModal.day.id : null,
        p_day_name:   dayName.trim(),
        p_event_date: dayDate,
        p_sort_order: parseInt(daySortOrder, 10) || 0,
      });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);
      setNotice({ kind: 'ok', text: dayModal.mode === 'create' ? 'Day created.' : 'Day updated.' });
      setDayModal(null);
      fetchSlots();
    } catch (err) {
      setDayModalError(err.message || 'Could not save day.');
    } finally {
      setDayModalBusy(false);
    }
  };

  const handleDeleteDay = async (day) => {
    if (!window.confirm(`Delete "${day.day_name}"? Its slots will remain but become unassigned.`)) return;
    try {
      const { data, error } = await supabase.rpc('admin_delete_day', { p_id: day.id });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);
      setNotice({ kind: 'ok', text: `Day "${day.day_name}" deleted. Slots are now unassigned.` });
      fetchSlots();
    } catch (err) {
      setNotice({ kind: 'error', text: err.message || 'Could not delete day.' });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setLoginError('Sign-in failed. Check your email and password.');
    } catch {
      setLoginError('Unable to sign in. Please try again.');
    } finally { setSigningIn(false); }
  };

  const handleLogout = () => supabase.auth.signOut();

  const handleToggleUploadStatus = async () => {
    const next = !uploadEnabled;
    const confirmMessage = next
      ? 'Open presentation submissions? Participants will be able to upload pitch decks.'
      : 'Close presentation submissions? Participants will see the Submission Period Closed page.';
    if (!window.confirm(confirmMessage)) return;

    setTogglingUpload(true);
    try {
      const { data, error } = await supabase.rpc('set_upload_status', { p_enabled: next });
      if (error) {
        // Fallback: direct table upsert
        const { error: upsertErr } = await supabase.from('app_settings').upsert({
          key: 'upload_submissions',
          value: { enabled: next },
          updated_at: new Date().toISOString(),
        });
        if (upsertErr) throw upsertErr;
        setUploadEnabled(next);
        setNotice({ kind: 'ok', text: `Upload portal is now ${next ? 'OPEN' : 'CLOSED'}.` });
      } else {
        setUploadEnabled(Boolean(data));
        setNotice({ kind: 'ok', text: `Upload portal is now ${data ? 'OPEN' : 'CLOSED'}.` });
      }
    } catch (err) {
      console.error(err);
      setNotice({ kind: 'error', text: `Failed to update upload status: ${err.message}` });
    } finally {
      setTogglingUpload(false);
    }
  };

  const handleDelete = async (id, teamId, pptUrl, isLatest, hasEarlier) => {
    const after = isLatest ? (hasEarlier ? ' Their previous upload becomes the current one.' : ' They will show as not submitted.') : '';
    if (!window.confirm(`Delete this upload from ${teamId}? The file is removed and it can't be undone.${after}`)) return;

    // Delete file from storage first
    if (pptUrl) {
      const { error } = await supabase.storage.from('incubex-ppts').remove([pptUrl]);
      if (error) { setNotice({ kind: 'error', text: 'Could not delete the file. The submission has been kept.' }); return; }
    }

    // Delete database record
    const { error } = await supabase.from('submissions').delete().eq('id', id);
    if (error) { setNotice({ kind: 'error', text: 'The file was removed, but the submission could not be reset. Retry deleting this submission.' }); return; }
    fetchSubmissions();
  };

  const openDeck = async (pptUrl) => {
    const deckWindow = window.open('', '_blank');
    if (deckWindow) deckWindow.opener = null;
    let data, error;
    try {
      ({ data, error } = await supabase.storage.from('incubex-ppts').createSignedUrl(pptUrl, 60));
    } catch {
      deckWindow?.close();
      setNotice({ kind: 'error', text: 'Could not open the deck. Please try again.' });
      return;
    }
    if (data && deckWindow) deckWindow.location.replace(data.signedUrl);
    else {
      deckWindow?.close();
      setNotice({ kind: 'error', text: error ? 'Could not open the deck. Please try again.' : 'Allow pop-ups to open this deck.' });
    }
  };

  const handleAddTeams = async (e) => {
    e.preventDefault();
    const { rows, rejected } = parseTeamLines(teamsText);
    if (rows.length === 0) {
      setNotice({ kind: 'error', text: rejected.length ? `No valid Team IDs. Use INC-12345 or a 4-5 digit number (not: ${rejected.slice(0, 3).join(', ')}).` : 'Paste at least one Team ID.' });
      return;
    }
    setTeamsBusy(true);
    setNotice(null);
    const known = new Set(submissions.map((s) => s.team_id));
    const fresh = rows.filter((r) => !known.has(r.team_id));
    let error = null;
    if (fresh.length) {
      ({ error } = await supabase.from('teams').upsert(fresh, { onConflict: 'team_id', ignoreDuplicates: true }));
    }
    setTeamsBusy(false);
    if (error) {
      const missing = error.code === '42501' || error.code === 'PGRST204' || error.code === '42703';
      setNotice({ kind: 'error', text: missing ? NEEDS_MIGRATION : `Couldn't add teams: ${error.message}` });
      return;
    }
    const parts = [`Added ${fresh.length} team${fresh.length === 1 ? '' : 's'}.`];
    if (rows.length - fresh.length) parts.push(`${rows.length - fresh.length} already listed.`);
    if (rejected.length) parts.push(`Skipped ${rejected.length} invalid: ${rejected.slice(0, 3).join(', ')}${rejected.length > 3 ? '…' : ''}`);
    setNotice({ kind: rejected.length ? 'error' : 'ok', text: parts.join(' ') });
    setTeamsText(rejected.join('\n'));
    fetchSubmissions();
  };

  const handleRemoveTeam = async (teamId) => {
    if (!window.confirm(`Remove ${teamId} from the team list? They won't be able to upload.`)) return;
    const { error } = await supabase.from('teams').delete().eq('team_id', teamId);
    if (error) {
      setNotice({ kind: 'error', text: error.code === '23503' ? `${teamId} has a submission. Delete the deck first.` : (error.code === '42501' ? NEEDS_MIGRATION : `Couldn't remove ${teamId}: ${error.message}`) });
      return;
    }
    setNotice({ kind: 'ok', text: `Removed ${teamId}.` });
    fetchSubmissions();
  };

  const handleExport = async () => {
    // Collect all paths to sign
    const paths = filteredSubmissions.map(s => s.ppt_url).filter(Boolean);
    let signedUrlsMap = {};

    if (paths.length > 0) {
      const { data } = await supabase.storage.from('incubex-ppts').createSignedUrls(paths, 60 * 60 * 24 * 7); // 7 days valid
      if (data) {
        data.forEach(item => {
          if (!item.error) signedUrlsMap[item.path] = item.signedUrl;
        });
      }
    }

    const exportData = filteredSubmissions.map((sub) => ({
      'Team ID': sub.team_id,
      'Team name': sub.team_name || '',
      'Leader email': sub.leader_email || '',
      'Uploads': sub.uploads.length,
      'Latest upload': sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'Not submitted',
      'Latest deck link': sub.ppt_url ? (signedUrlsMap[sub.ppt_url] || 'Error generating link') : 'Not submitted',
      ...(backupsAvailable && { 'Backup': sub.ppt_url ? backupInfo(sub.backup).label : 'N/A' })
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
    XLSX.writeFile(workbook, `Incubex_Submissions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const counts = useMemo(() => {
    const c = { all: submissions.length, submitted: 0, not_submitted: 0 };
    submissions.forEach((s) => { c[s.state] += 1; });
    return c;
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    const q = query.trim().toUpperCase();
    let result = submissions;
    if (statusFilter !== 'all') result = result.filter(s => s.state === statusFilter);
    if (q) result = result.filter(s => [s.team_id, s.team_name, s.leader_email].some(value => value?.toUpperCase().includes(q)));
    // Newest upload first; teams that haven't uploaded last, by Team ID
    return [...result].sort((a, b) =>
      (Date.parse(b.submitted_at || 0) || 0) - (Date.parse(a.submitted_at || 0) || 0)
      || a.team_id.localeCompare(b.team_id, undefined, { numeric: true }));
  }, [submissions, statusFilter, query]);

  if (loading) {
    return (
      <main className="portal">
        <div className="portal-loading"><Loader2 size={32} className="portal-spin" /></div>
      </main>
    );
  }

  if (!session || !authorized) {
    return (
      <PortalShell>
        <header className="portal-head">
          <span className="portal-wordmark" aria-label="INCUBEX">INCUBE<span>X</span></span>
          <h1 className="portal-title">Organiser sign in</h1>
        </header>

        <div className="portal-card">
          <form className="portal-form" onSubmit={handleLogin}>
            <div className="portal-field">
              <label className="portal-label" htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                className="portal-input"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={signingIn}
              />
            </div>
            <div className="portal-field">
              <label className="portal-label" htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                className="portal-input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={signingIn}
              />
            </div>

            {loginError && (
              <div className="portal-alert portal-alert--error" role="alert">
                <AlertCircle size={18} />
                <span>{loginError}</span>
              </div>
            )}

            <button type="submit" className="portal-btn portal-btn--block" disabled={signingIn}>
              {signingIn
                ? <><Loader2 size={18} className="portal-spin" /> Signing in…</>
                : <>Sign in <ArrowRight size={18} /></>}
            </button>
            {session && <button type="button" className="portal-btn portal-btn--ghost" onClick={handleLogout}>Sign out of this account</button>}
          </form>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell wide>
      <div className="portal-toolbar">
        <header>
          <span className="portal-wordmark" aria-label="INCUBEX">INCUBE<span>X</span></span>
          <h1 className="portal-title">{activeTab === 'slots' ? 'Pitch Time Slots' : 'Submissions'}</h1>
        </header>
        <div className="portal-toolbar-actions">
          {activeTab === 'submissions' ? (
            <>
              {SLOTS_ENABLED && <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" onClick={() => setActiveTab('slots')}>
                <Clock size={15} /> Time Slots
              </button>}
              <button
                type="button"
                className="portal-btn portal-btn--ghost portal-btn--sm"
                style={{
                  borderColor: uploadEnabled ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)',
                  color: uploadEnabled ? '#4ade80' : '#f87171',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={handleToggleUploadStatus}
                disabled={togglingUpload}
                title={uploadEnabled ? 'Upload portal is currently OPEN. Click to lock.' : 'Upload portal is currently CLOSED. Click to open.'}
              >
                {togglingUpload ? (
                  <Loader2 size={15} className="portal-spin" />
                ) : uploadEnabled ? (
                  <Unlock size={15} />
                ) : (
                  <Lock size={15} />
                )}
                <span>Submissions: {uploadEnabled ? 'OPEN' : 'CLOSED'}</span>
              </button>
              <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" onClick={() => setTeamsOpen((o) => !o)} aria-expanded={teamsOpen}>
                <Users size={15} /> Teams
              </button>
              <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" onClick={fetchSubmissions} disabled={refreshing} aria-label="Refresh">
                <RefreshCw size={15} className={refreshing ? 'portal-spin' : ''} /> Refresh
              </button>
              <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" onClick={() => runAction(handleExport)} disabled={filteredSubmissions.length === 0}>
                <Download size={15} /> Export
              </button>
            </>
          ) : (
            <>
              <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" onClick={() => setActiveTab('submissions')}>
                <Users size={15} /> Submissions
              </button>
              <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" onClick={fetchSlots} disabled={slotsLoading} aria-label="Refresh">
                <RefreshCw size={15} className={slotsLoading ? 'portal-spin' : ''} /> Refresh
              </button>
              <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" onClick={handleOpenCreateDayModal}>
                <CalendarDays size={15} /> New Day
              </button>
              <button type="button" className="portal-btn portal-btn--sm" onClick={openCreateSlotModal}>
                <Plus size={15} /> New Slot
              </button>
            </>
          )}
          <button type="button" className="portal-btn portal-btn--sm" onClick={handleLogout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>

      {notice && (
        <div className={`portal-alert portal-alert--${notice.kind === 'ok' ? 'ok' : 'error'} portal-notice`} role="status">
          {notice.kind === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notice.text}</span>
          <button type="button" className="portal-notice-close" aria-label="Dismiss" onClick={() => setNotice(null)}><X size={14} /></button>
        </div>
      )}

      {activeTab === 'slots' ? (
        <div className="portal-slots-view">
          {/* ── Days management strip ── */}
          {days.length > 0 && (
            <div className="portal-card" style={{ marginBottom: 20, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--p-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Event Days
                </span>
                <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" style={{ minHeight: 32, padding: '4px 12px', fontSize: '0.78rem' }} onClick={handleOpenCreateDayModal}>
                  <Plus size={13} /> Add Day
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {days.map((day) => (
                  <div key={day.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f4f3fc', border: '1px solid var(--p-line-soft)', borderRadius: 12, fontSize: '0.84rem' }}>
                    <CalendarDays size={13} style={{ color: 'var(--p-blue)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, color: 'var(--p-ink)' }}>{day.day_name}</span>
                    <span style={{ color: 'var(--p-muted)', fontSize: '0.75rem' }}>
                      {new Date(day.event_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="portal-pill portal-pill--cap" style={{ fontSize: '0.7rem', padding: '2px 7px' }}>
                      {day.slot_count || 0} slots
                    </span>
                    <button type="button" className="portal-link" style={{ fontSize: '0.78rem', minHeight: 'auto' }} onClick={() => handleOpenEditDayModal(day)} title="Edit day">
                      <Edit2 size={11} />
                    </button>
                    <button type="button" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: '#be123c', display: 'flex', alignItems: 'center' }} onClick={() => handleDeleteDay(day)} title="Delete day">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slotsLoading && slots.length === 0 ? (
            <div className="portal-loading"><Loader2 size={30} className="portal-spin" /></div>
          ) : slots.length === 0 ? (
            <div className="portal-card portal-empty" style={{ textAlign: 'center', padding: '48px 20px' }}>
              <Clock size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 6px' }}>No Pitch Time Slots Yet</h3>
              <p className="portal-muted" style={{ margin: '0 0 20px' }}>Create days first, then add slots within each day.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="portal-btn portal-btn--ghost" onClick={handleOpenCreateDayModal}>
                  <CalendarDays size={16} /> Create Day
                </button>
                <button type="button" className="portal-btn" onClick={openCreateSlotModal}>
                  <Plus size={16} /> Create Slot
                </button>
              </div>
            </div>
          ) : (() => {
            // Group slots: by day (ordered by sort_order/date), then unassigned
            const dayGroups = days.map((d) => ({
              ...d,
              slots: slots.filter((s) => s.day_id === d.id),
            }));
            const unassigned = slots.filter((s) => !s.day_id);

            const renderSlotCard = (slot) => {
              const isFull = (slot.booked_count || 0) >= (slot.max_teams || 0) && slot.max_teams > 0;
              const isExpanded = expandedSlots.has(slot.id);
              const toggleExpand = () => {
                setExpandedSlots(prev => {
                  const next = new Set(prev);
                  next.has(slot.id) ? next.delete(slot.id) : next.add(slot.id);
                  return next;
                });
              };

              return (
                <div key={slot.id} className={`portal-slot-card${slot.is_ended ? ' is-ended' : ''}`}>
                  <div className="portal-slot-header">
                    <div className="portal-slot-title-group">
                      <h3 className="portal-slot-name">
                        {slot.slot_name}
                        {slot.is_ended ? (
                          <span className="portal-pill portal-pill--ended">Ended</span>
                        ) : isFull ? (
                          <span className="portal-pill portal-pill--full">Full</span>
                        ) : (
                          <span className="portal-pill portal-pill--open">Open</span>
                        )}
                        <span className="portal-pill portal-pill--cap" title="Enrolled teams / Max capacity">
                          {slot.booked_count || 0} / {slot.max_teams} teams
                        </span>
                      </h3>
                      <div className="portal-slot-meta">
                        <span><Clock size={14} /> {formatSlotWindow(slot.start_time, slot.end_time)}</span>
                      </div>
                    </div>

                    <div className="portal-slot-actions">
                      <button
                        type="button"
                        className="portal-btn portal-btn--ghost portal-btn--sm"
                        onClick={() => handleToggleSlotEnded(slot.id, slot.is_ended)}
                        title={slot.is_ended ? 'Reopen this slot for bookings' : 'End this slot (freezes participant bookings)'}
                      >
                        {slot.is_ended ? <><Unlock size={14} /> Reopen</> : <><Lock size={14} /> End Slot</>}
                      </button>

                      <button
                        type="button"
                        className="portal-btn portal-btn--ghost portal-btn--sm"
                        onClick={() => openEditSlotModal(slot)}
                        title="Edit slot"
                      >
                        <Edit2 size={14} /> Edit
                      </button>

                      <button
                        type="button"
                        className="portal-icon-btn portal-icon-btn--del"
                        onClick={() => handleDeleteSlot(slot)}
                        title="Delete slot"
                        aria-label={`Delete slot ${slot.slot_name}`}
                      >
                        <Trash2 size={15} />
                      </button>

                      <button
                        type="button"
                        className="portal-btn portal-btn--ghost portal-btn--sm"
                        onClick={toggleExpand}
                      >
                        <Users size={14} /> Teams ({slot.teams?.length || 0})
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="portal-slot-teams-section">
                      <div className="portal-slot-teams-head">
                        <span className="portal-slot-teams-title">Enrolled Teams ({slot.teams?.length || 0})</span>
                        <button
                          type="button"
                          className="portal-btn portal-btn--ghost portal-btn--sm"
                          onClick={() => {
                            setAddTeamModal({ slotId: slot.id, slotName: slot.slot_name });
                            setManualAddTeamId('');
                          }}
                        >
                          <UserPlus size={14} /> Assign Team
                        </button>
                      </div>

                      {!slot.teams || slot.teams.length === 0 ? (
                        <p className="portal-muted" style={{ fontSize: '0.88rem', margin: '8px 0' }}>No teams have booked this slot yet.</p>
                      ) : (
                        <div className="portal-slot-teams-list">
                          {slot.teams.map((t) => (
                            <div key={t.team_id} className="portal-slot-team-item">
                              <div>
                                <span className="portal-slot-team-id">{t.team_id}</span>
                                {t.team_name && <span className="portal-slot-team-name" style={{ marginLeft: 8 }}>{t.team_name}</span>}
                                {t.leader_email && <div className="portal-slot-team-meta">{t.leader_email}</div>}
                                <div className="portal-slot-team-meta">Booked: {formatWhen(t.booked_at)}</div>
                              </div>

                              <div className="portal-row-actions">
                                <button
                                  type="button"
                                  className="portal-btn portal-btn--ghost portal-btn--sm"
                                  onClick={() => {
                                    setMoveModal({ teamId: t.team_id, teamName: t.team_name, currentSlotId: slot.id });
                                    setTargetMoveSlotId('');
                                  }}
                                  title="Move team to another slot"
                                >
                                  <ArrowRightLeft size={13} /> Move
                                </button>

                                <button
                                  type="button"
                                  className="portal-icon-btn portal-icon-btn--del"
                                  onClick={() => handleRemoveTeamFromSlot(t.team_id)}
                                  title="Remove team from this slot"
                                  aria-label={`Remove team ${t.team_id}`}
                                >
                                  <UserMinus size={15} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {/* Day groups */}
                {dayGroups.map((group) => (
                  <div key={group.id}>
                    {/* Day header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CalendarDays size={18} style={{ color: 'var(--p-blue)' }} />
                        <div>
                          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--p-ink)' }}>{group.day_name}</span>
                          <span style={{ marginLeft: 10, fontSize: '0.82rem', color: 'var(--p-muted)' }}>
                            {new Date(group.event_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" style={{ fontSize: '0.78rem' }} onClick={() => handleOpenEditDayModal(group)}>
                          <Edit2 size={13} /> Edit Day
                        </button>
                        <button type="button" className="portal-btn portal-btn--sm" style={{ fontSize: '0.78rem' }} onClick={() => { openCreateSlotModal(); setSlotDayId(group.id); }}>
                          <Plus size={13} /> Add Slot
                        </button>
                      </div>
                    </div>

                    {group.slots.length === 0 ? (
                      <div style={{ padding: '20px', background: 'rgba(248,248,255,0.7)', border: '1.5px dashed var(--p-line-soft)', borderRadius: 16, textAlign: 'center' }}>
                        <p className="portal-muted" style={{ margin: 0, fontSize: '0.88rem' }}>No slots yet for this day.</p>
                        <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" style={{ marginTop: 10 }} onClick={() => { openCreateSlotModal(); setSlotDayId(group.id); }}>
                          <Plus size={14} /> Add First Slot
                        </button>
                      </div>
                    ) : (
                      <div className="portal-slots-container">
                        {group.slots.map(renderSlotCard)}
                      </div>
                    )}
                  </div>
                ))}

                {/* Unassigned slots */}
                {unassigned.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <FolderOpen size={17} style={{ color: 'var(--p-muted)' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--p-muted)' }}>Unassigned Slots</span>
                      <span className="portal-pill portal-pill--cap" style={{ fontSize: '0.7rem', padding: '2px 7px' }}>{unassigned.length}</span>
                    </div>
                    <div className="portal-slots-container">
                      {unassigned.map(renderSlotCard)}
                    </div>
                  </div>
                )}

                {/* If there are no days and no slots */}
                {dayGroups.length === 0 && unassigned.length === 0 && (
                  <div className="portal-card portal-empty" style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <Clock size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p className="portal-muted">No slots found.</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        <>
          {!uploadEnabled && (
            <div className="portal-alert portal-alert--error" style={{ marginBottom: 16 }} role="alert">
              <Lock size={18} />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span>Presentation submissions are currently <strong>CLOSED</strong>. Participants cannot upload decks right now.</span>
                <button
                  type="button"
                  className="portal-btn portal-btn--sm"
                  style={{ minHeight: 28, padding: '2px 10px', fontSize: '0.78rem' }}
                  onClick={handleToggleUploadStatus}
                  disabled={togglingUpload}
                >
                  Open Portal
                </button>
              </div>
            </div>
          )}
          {teamsOpen && (
            <form className="portal-card portal-teams" onSubmit={handleAddTeams}>
              <label className="portal-label" htmlFor="teams-input">Add teams</label>
              <textarea
                id="teams-input"
                className="portal-input"
                placeholder={'1003\n1004, leader@college.edu\nINC-12345'}
                value={teamsText}
                onChange={(e) => setTeamsText(e.target.value)}
                disabled={teamsBusy}
                spellCheck="false"
              />
              <div className="portal-teams-foot">
                <span className="portal-hint">One per line: Team ID, then the leader’s email if you have it. Or import an Excel/CSV with columns ID | Email.</span>
                <div className="portal-toolbar-actions">
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                    onChange={handleImportFile}
                    hidden
                  />
                  <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" onClick={() => importFileRef.current?.click()} disabled={teamsBusy}>
                    <FileSpreadsheet size={15} /> Import Excel/CSV
                  </button>
                  <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" onClick={() => { setTeamsOpen(false); setNotice(null); }}>Close</button>
                  <button type="submit" className="portal-btn portal-btn--sm" disabled={teamsBusy || !teamsText.trim()}>
                    {teamsBusy ? <><Loader2 size={15} className="portal-spin" /> Adding…</> : 'Add'}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="portal-controls">
            <div className="portal-chips" role="tablist" aria-label="Filter by status">
              {FILTERS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === key}
                  className={`portal-chip${statusFilter === key ? ' is-active' : ''}`}
                  onClick={() => setStatusFilter(key)}
                >
                  {label} <b>{counts[key] || 0}</b>
                </button>
              ))}
            </div>
            <label className="portal-search">
              <Search size={15} />
              <input
                className="portal-input"
                type="search"
                placeholder="Search Team ID"
                aria-label="Search Team ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>

          <div className="portal-card portal-table-wrap">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Deck</th>
                  <th>Uploaded</th>
                  <th aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.length === 0 ? (
                  <tr><td colSpan={4} className="portal-empty">{submissions.length === 0 ? 'No teams yet. Add them with Teams.' : 'Nothing matches.'}</td></tr>
                ) : filteredSubmissions.map((sub) => {
                  const info = backupsAvailable && sub.ppt_url ? backupInfo(sub.backup) : null;
                  const earlier = sub.uploads.slice(1);
                  const open = expanded.has(sub.team_id);
                  const toggle = () => setExpanded((cur) => { const n = new Set(cur); n.has(sub.team_id) ? n.delete(sub.team_id) : n.add(sub.team_id); return n; });
                  return (
                    <React.Fragment key={sub.team_id}>
                    <tr>
                      <td className="col-team">
                        <div className="portal-team">{sub.team_id}</div>
                        {sub.team_name && <div>{sub.team_name}</div>}
                        {sub.leader_email && <div className="portal-muted">{sub.leader_email}</div>}
                      </td>
                      <td className="col-deck">
                        {!sub.ppt_url ? (
                          <span className="portal-muted">Not submitted</span>
                        ) : (
                          <span className="portal-deck">
                            <button type="button" className="portal-link" onClick={() => openDeck(sub.ppt_url)}>Open</button>
                            <span className="portal-ext">{sub.ppt_url.split('.').pop()}</span>
                            {info && <span className={`portal-backup portal-backup--${info.mod}`} title={info.title} aria-label={info.label}></span>}
                            {earlier.length > 0 && (
                              <button type="button" className="portal-versions" onClick={toggle} aria-expanded={open}>
                                <History size={13} /> {earlier.length} earlier <ChevronDown size={12} className={open ? 'is-open' : ''} />
                              </button>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="col-when">{sub.submitted_at ? <span className="portal-when">{formatWhen(sub.submitted_at)}</span> : <span className="portal-muted">—</span>}</td>
                      <td className="col-actions">
                        <div className="portal-row-actions">
                          {sub.submitted ? (
                            <button type="button" className="portal-icon-btn portal-icon-btn--del" title="Delete this upload" aria-label={`Delete ${sub.team_id}'s latest upload`} onClick={() => runAction(() => handleDelete(sub.uploads[0].id, sub.team_id, sub.ppt_url, true, earlier.length > 0))}>
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <button type="button" className="portal-icon-btn portal-icon-btn--del" title="Remove team" aria-label={`Remove ${sub.team_id}`} onClick={() => runAction(() => handleRemoveTeam(sub.team_id))}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {open && earlier.map((u) => {
                      const ui = backupsAvailable ? backupInfo(u.backup) : null;
                      return (
                        <tr key={u.id} className="portal-earlier">
                          <td className="col-team"><span className="portal-muted">Earlier upload</span></td>
                          <td className="col-deck">
                            <span className="portal-deck">
                              <button type="button" className="portal-link" onClick={() => openDeck(u.ppt_url)}>Open</button>
                              <span className="portal-ext">{u.ppt_url.split('.').pop()}</span>
                              {ui && <span className={`portal-backup portal-backup--${ui.mod}`} title={ui.title} aria-label={ui.label}></span>}
                            </span>
                          </td>
                          <td className="col-when">{u.submitted_at ? <span className="portal-when">{formatWhen(u.submitted_at)}</span> : <span className="portal-muted">—</span>}</td>
                          <td className="col-actions">
                            <div className="portal-row-actions">
                              <button type="button" className="portal-icon-btn portal-icon-btn--del" title="Delete this upload" aria-label={`Delete an earlier upload from ${sub.team_id}`} onClick={() => runAction(() => handleDelete(u.id, sub.team_id, u.ppt_url, false, false))}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal: Create or Edit Time Slot */}
      {slotModal && (
        <div className="portal-modal-backdrop" onClick={() => !modalBusy && setSlotModal(null)}>
          <div className="portal-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="portal-modal-title">
              {slotModal.mode === 'create' ? 'Create Pitch Time Slot' : 'Edit Time Slot'}
            </h3>
            <form onSubmit={handleSaveSlot} className="portal-modal-form">
              <div className="portal-field">
                <label className="portal-label" htmlFor="slot-name">Slot Name / Title</label>
                <input
                  id="slot-name"
                  className="portal-input"
                  type="text"
                  placeholder="e.g. Qualifier Round 1 - Slot A"
                  value={slotName}
                  onChange={(e) => setSlotName(e.target.value)}
                  required
                  disabled={modalBusy}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="portal-field">
                  <label className="portal-label" htmlFor="slot-start">Start Time</label>
                  <input
                    id="slot-start"
                    className="portal-input"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    disabled={modalBusy}
                  />
                </div>

                <div className="portal-field">
                  <label className="portal-label" htmlFor="slot-end">End Time</label>
                  <input
                    id="slot-end"
                    className="portal-input"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    disabled={modalBusy}
                  />
                </div>
              </div>

              <div className="portal-field">
                <label className="portal-label" htmlFor="slot-max">Max Teams Capacity (Default: 0)</label>
                <input
                  id="slot-max"
                  className="portal-input"
                  type="number"
                  min="0"
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(e.target.value)}
                  required
                  disabled={modalBusy}
                />
                <span className="portal-hint">Set to 0 if no teams can book yet. Only admins can see this limit.</span>
              </div>

              <div className="portal-field">
                <label className="portal-label" htmlFor="slot-day">Event Day (optional)</label>
                <select
                  id="slot-day"
                  className="portal-input"
                  value={slotDayId}
                  onChange={(e) => setSlotDayId(e.target.value)}
                  style={{ height: 48 }}
                  disabled={modalBusy}
                >
                  <option value="">— No day assigned —</option>
                  {days.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.day_name} · {new Date(d.event_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </option>
                  ))}
                </select>
                <span className="portal-hint">Assigning a day groups this slot under that day's schedule.</span>
              </div>

              {modalError && (
                <div className="portal-alert portal-alert--error" role="alert">
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="portal-modal-actions">
                <button
                  type="button"
                  className="portal-btn portal-btn--ghost"
                  onClick={() => setSlotModal(null)}
                  disabled={modalBusy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="portal-btn"
                  disabled={modalBusy}
                >
                  {modalBusy ? <><Loader2 size={16} className="portal-spin" /> Saving…</> : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Move Team to Another Slot */}
      {moveModal && (
        <div className="portal-modal-backdrop" onClick={() => setMoveModal(null)}>
          <div className="portal-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="portal-modal-title">Move Team {moveModal.teamId}</h3>
            <p className="portal-muted" style={{ marginBottom: 16 }}>
              Select the new destination slot for team <strong>{moveModal.teamId}</strong> {moveModal.teamName && `(${moveModal.teamName})`}:
            </p>

            <div className="portal-field">
              <label className="portal-label">Destination Slot</label>
              <select
                className="portal-input"
                value={targetMoveSlotId}
                onChange={(e) => setTargetMoveSlotId(e.target.value)}
                style={{ height: 44 }}
              >
                <option value="">-- Choose destination slot --</option>
                {slots
                  .filter((s) => s.id !== moveModal.currentSlotId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.slot_name} ({s.booked_count || 0}/{s.max_teams} teams) {s.is_ended ? '[ENDED]' : ''}
                    </option>
                  ))}
              </select>
            </div>

            <div className="portal-modal-actions">
              <button type="button" className="portal-btn portal-btn--ghost" onClick={() => setMoveModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="portal-btn"
                disabled={!targetMoveSlotId}
                onClick={handleMoveTeam}
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Assign Team to Slot */}
      {addTeamModal && (
        <div className="portal-modal-backdrop" onClick={() => setAddTeamModal(null)}>
          <div className="portal-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="portal-modal-title">Assign Team to Slot</h3>
            <p className="portal-muted" style={{ marginBottom: 16 }}>
              Assign a team to <strong>{addTeamModal.slotName}</strong>:
            </p>

            <form onSubmit={handleAddTeamToSlot} className="portal-modal-form">
              <div className="portal-field">
                <label className="portal-label" htmlFor="manual-team-id">Team ID</label>
                <input
                  id="manual-team-id"
                  className="portal-input portal-input--id"
                  type="text"
                  placeholder="e.g. 1003 or INC-12345"
                  value={manualAddTeamId}
                  onChange={(e) => setManualAddTeamId(e.target.value.toUpperCase())}
                  required
                  autoFocus
                />
                <span className="portal-hint">Team must exist in the teams list. If they already had another slot, they will be moved here.</span>
              </div>

              <div className="portal-modal-actions">
                <button type="button" className="portal-btn portal-btn--ghost" onClick={() => setAddTeamModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="portal-btn" disabled={!manualAddTeamId.trim()}>
                  Assign Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Event Day */}
      {dayModal && (
        <div className="portal-modal-backdrop" onClick={() => !dayModalBusy && setDayModal(null)}>
          <div className="portal-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="portal-modal-title">
              {dayModal.mode === 'create' ? 'Create Event Day' : 'Edit Event Day'}
            </h3>
            <form onSubmit={handleSaveDay} className="portal-modal-form">
              <div className="portal-field">
                <label className="portal-label" htmlFor="day-name">Day Name</label>
                <input
                  id="day-name"
                  className="portal-input"
                  type="text"
                  placeholder="e.g. Day 1 – Qualifiers"
                  value={dayName}
                  onChange={(e) => setDayName(e.target.value)}
                  required
                  disabled={dayModalBusy}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="portal-field">
                  <label className="portal-label" htmlFor="day-date">Date</label>
                  <input
                    id="day-date"
                    className="portal-input"
                    type="date"
                    value={dayDate}
                    onChange={(e) => setDayDate(e.target.value)}
                    required
                    disabled={dayModalBusy}
                  />
                </div>

                <div className="portal-field">
                  <label className="portal-label" htmlFor="day-order">Display Order</label>
                  <input
                    id="day-order"
                    className="portal-input"
                    type="number"
                    min="0"
                    value={daySortOrder}
                    onChange={(e) => setDaySortOrder(e.target.value)}
                    disabled={dayModalBusy}
                  />
                  <span className="portal-hint">Lower = shown first</span>
                </div>
              </div>

              {dayModalError && (
                <div className="portal-alert portal-alert--error" role="alert">
                  <AlertCircle size={16} />
                  <span>{dayModalError}</span>
                </div>
              )}

              <div className="portal-modal-actions">
                <button
                  type="button"
                  className="portal-btn portal-btn--ghost"
                  onClick={() => setDayModal(null)}
                  disabled={dayModalBusy}
                >
                  Cancel
                </button>
                <button type="submit" className="portal-btn" disabled={dayModalBusy}>
                  {dayModalBusy ? <><Loader2 size={16} className="portal-spin" /> Saving…</> : 'Save Day'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
