import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';
import { Lock, Loader2, LogOut, Check, X, RefreshCw, ExternalLink, AlertCircle, ArrowRight, Download, Trash2, MessageSquareWarning } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const [submissions, setSubmissions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected, not_submitted

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) fetchSubmissions();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchSubmissions();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchSubmissions = async () => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from('teams')
      .select('team_id, created_at, submissions(id, ppt_url, submitted, approval_status, submitted_at, appeal_message)')
      .order('created_at', { ascending: false });

    if (data) {
      const formatted = data.map(t => {
        const sub = Array.isArray(t.submissions) ? t.submissions[0] : t.submissions;
        return {
          team_id: t.team_id,
          submission_id: sub?.id,
          ppt_url: sub?.ppt_url,
          submitted: !!sub?.submitted,
          approval_status: sub ? (sub.approval_status || 'pending') : 'not_submitted',
          submitted_at: sub?.submitted_at,
          appeal_message: sub?.appeal_message
        };
      });
      setSubmissions(formatted);
    }
    setRefreshing(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError(error.message);
    setSigningIn(false);
  };

  const handleLogout = () => supabase.auth.signOut();

  const handleApprove = async (id, status, teamId) => {
    if (!window.confirm(`Are you sure you want to mark ${teamId} as ${status.toUpperCase()}?`)) return;
    await supabase.from('submissions').update({ approval_status: status }).eq('id', id);
    fetchSubmissions();
  };

  const handleDelete = async (id, teamId, pptUrl) => {
    if (!window.confirm(`Are you sure you want to completely DELETE ${teamId}'s submission? This cannot be undone.`)) return;
    
    // Delete file from storage first
    if (pptUrl) {
      await supabase.storage.from('incubex-ppts').remove([pptUrl]);
    }
    
    // Delete database record
    await supabase.from('submissions').delete().eq('id', id);
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
      'Status': sub.approval_status.toUpperCase(),
      'Submitted At': sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'N/A',
      'Pitch Deck Link': sub.ppt_url ? (signedUrlsMap[sub.ppt_url] || 'Error generating link') : 'Not Submitted'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
    XLSX.writeFile(workbook, `Incubex_Submissions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const stats = useMemo(() => ({
    total: submissions.length,
    pending: submissions.filter((s) => s.approval_status === 'pending').length,
    approved: submissions.filter((s) => s.approval_status === 'approved').length,
    rejected: submissions.filter((s) => s.approval_status === 'rejected').length,
    not_submitted: submissions.filter((s) => s.approval_status === 'not_submitted').length,
  }), [submissions]);

  const filteredSubmissions = useMemo(() => {
    let result = submissions;
    if (statusFilter !== 'all') {
      result = submissions.filter(s => s.approval_status === statusFilter);
    }
    // Always sort so that "pending" items float to the top
    return [...result].sort((a, b) => {
      if (a.approval_status === 'pending' && b.approval_status !== 'pending') return -1;
      if (b.approval_status === 'pending' && a.approval_status !== 'pending') return 1;
      return 0;
    });
  }, [submissions, statusFilter]);

  if (loading) {
    return (
      <main className="portal">
        <div className="portal-loading"><Loader2 size={36} className="portal-spin" /></div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="portal">
        <section className="portal-shell">
          <span className="portal-dot portal-dot--a" aria-hidden="true"></span>
          <span className="portal-dot portal-dot--b" aria-hidden="true"></span>

          <div className="portal-inner portal-inner--narrow" style={{ maxWidth: 460 }}>
            <header className="portal-head">
              <img className="portal-wordmark" src="/assets/incubex-wordmark.png" alt="INCUBEX" width="340" height="96" />
              <span className="portal-kicker">Organisers Only</span>
              <h1 className="portal-title">Admin <em>sign in</em></h1>
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
                    ? <><Loader2 size={18} className="portal-spin" /> Signing in...</>
                    : <><Lock size={16} /> Sign in <ArrowRight size={18} /></>}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="portal">
      <section className="portal-shell">
        <span className="portal-dot portal-dot--a" aria-hidden="true"></span>

        <div className="portal-inner">
          <div className="portal-toolbar">
            <header className="portal-head">
              <span className="portal-kicker">INCUBEX 2026 · Admin</span>
              <h1 className="portal-title">Pitch deck <em>submissions</em></h1>
            </header>
            <div className="portal-toolbar-actions">
              <select className="portal-input" style={{ width: 'auto', padding: '0.25rem 0.75rem', height: '32px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Teams</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="not_submitted">Not Submitted</option>
              </select>
              <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" onClick={handleExport} disabled={submissions.length === 0}>
                <Download size={15} /> Export
              </button>
              <button type="button" className="portal-btn portal-btn--ghost portal-btn--sm" onClick={fetchSubmissions} disabled={refreshing}>
                <RefreshCw size={15} className={refreshing ? 'portal-spin' : ''} /> Refresh
              </button>
              <button type="button" className="portal-btn portal-btn--sm" onClick={handleLogout}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          </div>

          <div className="portal-stats">
            <div className="portal-card portal-stat"><div className="portal-stat-label">Total Teams</div><div className="portal-stat-value">{stats.total}</div></div>
            <div className="portal-card portal-stat"><div className="portal-stat-label">Pending</div><div className="portal-stat-value">{stats.pending}</div></div>
            <div className="portal-card portal-stat"><div className="portal-stat-label">Approved</div><div className="portal-stat-value">{stats.approved}</div></div>
            <div className="portal-card portal-stat"><div className="portal-stat-label">Not Submitted</div><div className="portal-stat-value">{stats.not_submitted}</div></div>
          </div>

          <div className="portal-card portal-table-wrap">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Team ID</th>
                  <th>Pitch Deck</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.length === 0 ? (
                  <tr><td colSpan={5} className="portal-empty">No records found.</td></tr>
                ) : filteredSubmissions.map((sub) => {
                  const st = sub.approval_status;
                  return (
                    <tr key={sub.team_id}>
                      <td>
                        <div className="is-strong">{sub.team_id}</div>
                        {sub.appeal_message && (
                          <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#b45309', display: 'flex', gap: '0.25rem', alignItems: 'flex-start', maxWidth: '200px', whiteSpace: 'normal', lineHeight: '1.2' }}>
                            <MessageSquareWarning size={14} style={{ flexShrink: 0 }} />
                            <span>{sub.appeal_message}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        {!sub.ppt_url ? (
                           <span className="portal-muted">Not Submitted</span>
                        ) : sub.ppt_url.startsWith('http') ? (
                           <a className="portal-link" href={sub.ppt_url} target="_blank" rel="noopener noreferrer">
                             View deck <ExternalLink size={14} />
                           </a>
                        ) : (
                           <button type="button" className="portal-link" onClick={async () => {
                             const { data, error } = await supabase.storage.from('incubex-ppts').createSignedUrl(sub.ppt_url, 60);
                             if (data) window.open(data.signedUrl, '_blank');
                             else alert('Could not generate secure link: ' + error?.message);
                           }}>
                             View deck <ExternalLink size={14} />
                           </button>
                        )}
                      </td>
                      <td>{sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '—'}</td>
                      <td><span className={`portal-badge portal-badge--${st}`}>{st.replace('_', ' ')}</span></td>
                      <td>
                        <div className="portal-row-actions">
                          {sub.submitted && (
                            <>
                              <button type="button" className="portal-icon-btn portal-icon-btn--ok" title="Approve" aria-label={`Approve ${sub.team_id}`} onClick={() => handleApprove(sub.submission_id, 'approved', sub.team_id)}>
                                <Check size={16} />
                              </button>
                              <button type="button" className="portal-icon-btn portal-icon-btn--no" title="Reject" aria-label={`Reject ${sub.team_id}`} onClick={() => handleApprove(sub.submission_id, 'rejected', sub.team_id)}>
                                <X size={16} />
                              </button>
                              <button type="button" className="portal-icon-btn" style={{ color: '#be123c', backgroundColor: 'rgba(255, 228, 230, 0.7)' }} title="Delete/Reset Submission" aria-label={`Delete ${sub.team_id}`} onClick={() => handleDelete(sub.submission_id, sub.team_id, sub.ppt_url)}>
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
