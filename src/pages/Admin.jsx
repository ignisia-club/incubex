import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { Loader2, LogOut, Check, X, RefreshCw, AlertCircle, ArrowRight, Download, Trash2, MessageSquareWarning, Search, Users, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import PortalShell from '../components/PortalShell.jsx';

// Maps a ppt_backups row (or its absence) to a label + dot colour.
function backupInfo(backup) {
  if (!backup) return { label: 'Backup not started', mod: 'none', title: 'No backup record yet. The webhook may not have fired; the 2-hourly sweep will pick it up.' };
  if (backup.status === 'success') return { label: 'Backed up', mod: 'success', title: `Backed up to B2 as ${backup.backup_key}` };
  if (backup.status === 'failed') return { label: 'Backup failed', mod: 'failed', title: `Backup failed: ${backup.error || 'it will be retried by the next sweep.'}` };
  return { label: 'Backup pending', mod: 'pending', title: 'Backup in progress' };
}

const FILTERS = [
  ['all', 'All'],
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
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

export default function Admin() {
  const [session, setSession] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const authGeneration = useRef(0);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const [submissions, setSubmissions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected, not_submitted
  const [query, setQuery] = useState('');
  const [backupsAvailable, setBackupsAvailable] = useState(false);

  const [teamsOpen, setTeamsOpen] = useState(false);
  const [teamsText, setTeamsText] = useState('');
  const [teamsBusy, setTeamsBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { kind: 'ok' | 'error', text }

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

  useEffect(() => {
    if (!authorized) return;
    fetchSubmissions();
    const timer = setInterval(fetchSubmissions, 30000);
    return () => clearInterval(timer);
  }, [authorized]);

  const fetchSubmissions = async () => {
    const generation = authGeneration.current;
    setRefreshing(true);
    try {
    const { data, error } = await supabase
      .from('teams')
      .select('team_id, team_name, leader_email, created_at, submissions(id, ppt_url, submitted, approval_status, submitted_at, appeal_message)')
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
      const formatted = data.map(t => {
        const sub = Array.isArray(t.submissions) ? t.submissions[0] : t.submissions;
        return {
          team_id: t.team_id,
          team_name: t.team_name,
          leader_email: t.leader_email,
          submission_id: sub?.id,
          ppt_url: sub?.ppt_url,
          submitted: !!sub?.submitted,
          approval_status: sub ? (sub.approval_status || 'pending') : 'not_submitted',
          submitted_at: sub?.submitted_at,
          appeal_message: sub?.appeal_message,
          backup: sub?.ppt_url ? backupByPath[sub.ppt_url] : undefined
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

  const handleApprove = async (id, status, teamId) => {
    if (!window.confirm(`Mark ${teamId} as ${status}?`)) return;
    const { error } = await supabase.from('submissions').update({ approval_status: status }).eq('id', id);
    if (error) { setNotice({ kind: 'error', text: 'Could not update the review status. Try again.' }); return; }
    fetchSubmissions();
  };

  const handleDelete = async (id, teamId, pptUrl) => {
    if (!window.confirm(`Delete ${teamId}'s deck? This removes the file and lets the team upload again. It cannot be undone.`)) return;

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
      'Status': sub.approval_status.toUpperCase(),
      'Submitted At': sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'N/A',
      'Pitch Deck Link': sub.ppt_url ? (signedUrlsMap[sub.ppt_url] || 'Error generating link') : 'Not Submitted',
      ...(backupsAvailable && { 'Backup': sub.ppt_url ? backupInfo(sub.backup).label : 'N/A' })
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
    XLSX.writeFile(workbook, `Incubex_Submissions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const counts = useMemo(() => {
    const c = { all: submissions.length, pending: 0, approved: 0, rejected: 0, not_submitted: 0 };
    submissions.forEach((s) => { c[s.approval_status] = (c[s.approval_status] || 0) + 1; });
    return c;
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    const q = query.trim().toUpperCase();
    let result = submissions;
    if (statusFilter !== 'all') result = result.filter(s => s.approval_status === statusFilter);
    if (q) result = result.filter(s => [s.team_id, s.team_name, s.leader_email].some(value => value?.toUpperCase().includes(q)));
    // Pending first, then newest upload first
    return [...result].sort((a, b) => {
      if (a.approval_status === 'pending' && b.approval_status !== 'pending') return -1;
      if (b.approval_status === 'pending' && a.approval_status !== 'pending') return 1;
      return (Date.parse(b.submitted_at || 0) || 0) - (Date.parse(a.submitted_at || 0) || 0);
    });
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
          <h1 className="portal-title">Submissions</h1>
        </header>
        <div className="portal-toolbar-actions">
          <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" onClick={() => setTeamsOpen((o) => !o)} aria-expanded={teamsOpen}>
            <Users size={15} /> Teams
          </button>
          <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" onClick={fetchSubmissions} disabled={refreshing} aria-label="Refresh">
            <RefreshCw size={15} className={refreshing ? 'portal-spin' : ''} /> Refresh
          </button>
          <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" onClick={() => runAction(handleExport)} disabled={filteredSubmissions.length === 0}>
            <Download size={15} /> Export
          </button>
          <button type="button" className="portal-btn portal-btn--sm" onClick={handleLogout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>

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
            <span className="portal-hint">One per line: Team ID, then the leader’s email if you have it.</span>
            <div className="portal-toolbar-actions">
              <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" onClick={() => { setTeamsOpen(false); setNotice(null); }}>Close</button>
              <button type="submit" className="portal-btn portal-btn--sm" disabled={teamsBusy || !teamsText.trim()}>
                {teamsBusy ? <><Loader2 size={15} className="portal-spin" /> Adding…</> : 'Add'}
              </button>
            </div>
          </div>
        </form>
      )}

      {notice && (
        <div className={`portal-alert portal-alert--${notice.kind === 'ok' ? 'ok' : 'error'} portal-notice`} role="status">
          {notice.kind === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notice.text}</span>
          <button type="button" className="portal-notice-close" aria-label="Dismiss" onClick={() => setNotice(null)}><X size={14} /></button>
        </div>
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
              <th>Submitted</th>
              <th>Status</th>
              <th aria-label="Actions"></th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.length === 0 ? (
              <tr><td colSpan={5} className="portal-empty">{submissions.length === 0 ? 'No teams yet. Add them with Teams.' : 'Nothing matches.'}</td></tr>
            ) : filteredSubmissions.map((sub) => {
              const st = sub.approval_status;
              const info = backupsAvailable && sub.ppt_url ? backupInfo(sub.backup) : null;
              return (
                <tr key={sub.team_id}>
                  <td className="col-team">
                    <div className="portal-team">{sub.team_id}</div>
                    {sub.team_name && <div>{sub.team_name}</div>}
                    {sub.leader_email && <div className="portal-muted">{sub.leader_email}</div>}
                    {sub.appeal_message && (
                      <div className="portal-appeal" title="Resubmission request">
                        <MessageSquareWarning size={14} />
                        <span>{sub.appeal_message}</span>
                      </div>
                    )}
                  </td>
                  <td className="col-deck">
                    {!sub.ppt_url ? (
                      <span className="portal-muted">—</span>
                    ) : (
                      <span className="portal-deck">
                        <button type="button" className="portal-link" onClick={() => openDeck(sub.ppt_url)}>Open</button>
                        <span className="portal-ext">{sub.ppt_url.split('.').pop()}</span>
                        {info && <span className={`portal-backup portal-backup--${info.mod}`} title={info.title} aria-label={info.label}></span>}
                      </span>
                    )}
                  </td>
                  <td className="col-when">{sub.submitted_at ? <span className="portal-when">{formatWhen(sub.submitted_at)}</span> : <span className="portal-muted">—</span>}</td>
                  <td className="col-status"><span className={`portal-badge portal-badge--${st}`}>{st.replace('_', ' ')}</span></td>
                  <td className="col-actions">
                    {!sub.submitted && (
                      <div className="portal-row-actions">
                        <button type="button" className="portal-icon-btn portal-icon-btn--del" title="Remove team" aria-label={`Remove ${sub.team_id}`} onClick={() => runAction(() => handleRemoveTeam(sub.team_id))}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                    {sub.submitted && (
                      <div className="portal-row-actions">
                        <button type="button" className="portal-icon-btn portal-icon-btn--ok" title="Approve" aria-label={`Approve ${sub.team_id}`} onClick={() => runAction(() => handleApprove(sub.submission_id, 'approved', sub.team_id))}>
                          <Check size={16} />
                        </button>
                        <button type="button" className="portal-icon-btn portal-icon-btn--no" title="Reject" aria-label={`Reject ${sub.team_id}`} onClick={() => runAction(() => handleApprove(sub.submission_id, 'rejected', sub.team_id))}>
                          <X size={16} />
                        </button>
                        <button type="button" className="portal-icon-btn portal-icon-btn--del" title="Delete and let the team re-upload" aria-label={`Delete ${sub.team_id}`} onClick={() => runAction(() => handleDelete(sub.submission_id, sub.team_id, sub.ppt_url))}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}
