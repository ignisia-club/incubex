import React, { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, ArrowRight, FileText, Download } from 'lucide-react';

// INC-12345, or a Club OS team number (4-5 digits, leading zeros kept).
const TEAM_ID_PATTERN = /^(INC-\d{5}|\d{4,5})$/;
const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXT = ['pdf', 'ppt', 'pptx'];
const MIME_BY_EXT = {
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

const formatWhen = (d) => d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

function PortalShell({ children }) {
  return (
    <main className="portal">
      <section className="portal-shell">
        <img className="portal-art portal-art--sparkle" src="/assets/hero-poster-sparkle.png" width="349" height="349" alt="" aria-hidden="true" />
        <img className="portal-art portal-art--star" src="/assets/competition-star.png" width="673" height="762" alt="" aria-hidden="true" />
        <div className="portal-inner portal-inner--narrow">{children}</div>
      </section>
    </main>
  );
}

export default function Upload() {
  const [teamId, setTeamId] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error | appeal_success
  const [message, setMessage] = useState('');
  const [appealMessage, setAppealMessage] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [mode, setMode] = useState('upload'); // upload | appeal (team already submitted)

  const fail = (msg) => { setStatus('error'); setMessage(msg); };

  const pickFile = (picked) => {
    if (!picked) return;
    const ext = picked.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return fail('Only PDF, PPT or PPTX files are accepted.');
    if (picked.size > MAX_BYTES) return fail('File is larger than 25 MB. Please compress it and try again.');
    setFile(picked);
    if (status === 'error') { setStatus('idle'); setMessage(''); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const id = teamId.trim().toUpperCase();
    if (!TEAM_ID_PATTERN.test(id)) return fail('Enter the Team ID from your registration, e.g. 1003 or INC-12345.');
    if (!file) return fail('Please attach your deck.');

    setStatus('uploading');
    setMessage('Checking Team ID');

    try {
      const { data: teamInfo, error: teamError } = await supabase.rpc('get_team_status', { p_team_id: id });

      if (teamError || !teamInfo || !teamInfo.exists) throw new Error('We couldn’t find that Team ID. Check it and try again.');

      if (teamInfo.submitted) {
        setMode('appeal');
        setStatus('idle');
        setMessage('');
        return;
      }

      setMessage('Uploading');
      const fileExt = file.name.split('.').pop().toLowerCase();
      // Path format <TEAM_ID>_<timestamp>.<ext> is enforced by storage + submissions RLS.
      const filePath = `${id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('incubex-ppts')
        .upload(filePath, file, { contentType: MIME_BY_EXT[fileExt], upsert: false });

      if (uploadError) throw new Error('The upload failed. Please try again.');

      setMessage('Saving');
      // Bucket is private: store the storage path; admins open it via a short-lived signed URL.
      const { error: submitError } = await supabase
        .from('submissions')
        .insert({
          team_id: id,
          ppt_url: filePath,
          submitted: true,
          submitted_at: new Date().toISOString()
        });

      if (submitError) {
        if (submitError.code === '23505') throw new Error('Your team has already submitted a deck.');
        throw new Error('We couldn’t save your submission. Please try again.');
      }

      setReceipt({ teamId: id, fileName: file.name, at: new Date() });
      setStatus('success');
      setMessage('');
    } catch (err) {
      console.error(err);
      fail(err.message || 'Something went wrong. Please try again.');
    }
  };

  const handleAppeal = async (e) => {
    e.preventDefault();
    if (!appealMessage.trim()) return fail('Tell us why you need to resubmit.');

    setStatus('uploading');
    setMessage('Sending');
    const { error } = await supabase.rpc('submit_appeal', {
      p_team_id: teamId.trim().toUpperCase(),
      p_message: appealMessage.trim()
    });

    if (error) {
      fail('We couldn’t send your request. Please try again later.');
    } else {
      setStatus('appeal_success');
    }
  };

  const reset = () => { setMode('upload'); setStatus('idle'); setTeamId(''); setFile(null); setMessage(''); setAppealMessage(''); setReceipt(null); };
  const busy = status === 'uploading';
  const appealing = mode === 'appeal';

  if (status === 'success' && receipt) {
    return (
      <PortalShell>
        <div className="portal-card portal-success" role="status">
          <div className="portal-success-icon"><CheckCircle2 size={30} /></div>
          <h2>Deck received</h2>
          <dl className="portal-receipt">
            <div><dt>Team ID</dt><dd>{receipt.teamId}</dd></div>
            <div><dt>File</dt><dd>{receipt.fileName}</dd></div>
            <div><dt>Received</dt><dd>{formatWhen(receipt.at)}</dd></div>
          </dl>
          <button type="button" className="portal-btn portal-btn--ghost portal-btn--block" onClick={reset}>Upload for another team</button>
        </div>
      </PortalShell>
    );
  }

  if (status === 'appeal_success') {
    return (
      <PortalShell>
        <div className="portal-card portal-success" role="status">
          <div className="portal-success-icon"><CheckCircle2 size={30} /></div>
          <h2>Request sent</h2>
          <p>The organisers will review it.</p>
          <button type="button" className="portal-btn portal-btn--ghost portal-btn--block" style={{ marginTop: '1.4rem' }} onClick={reset}>Done</button>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <header className="portal-head">
        <span className="portal-wordmark" aria-label="INCUBEX">INCUBE<span>X</span></span>
        <h1 className="portal-title">{appealing ? 'Already submitted' : 'Submit your deck'}</h1>
      </header>

      <div className="portal-card">
        <form className="portal-form" onSubmit={appealing ? handleAppeal : handleUpload} noValidate>
          {appealing ? (
            <>
              <div className="portal-alert portal-alert--info">
                <AlertCircle size={18} />
                <span><strong>{teamId.trim().toUpperCase()}</strong> has already uploaded a deck. To replace it, send a request.</span>
              </div>
              <div className="portal-field">
                <label className="portal-label" htmlFor="appeal">Why do you need to resubmit?</label>
                <textarea
                  id="appeal"
                  className="portal-input"
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                  disabled={busy}
                  maxLength={500}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="portal-field">
                <label className="portal-label" htmlFor="team-id">Team ID</label>
                <input
                  id="team-id"
                  className="portal-input portal-input--id"
                  type="text"
                  autoComplete="off"
                  spellCheck="false"
                  maxLength={9}
                  placeholder="e.g. 1003"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value.toUpperCase())}
                  disabled={busy}
                  required
                />
              </div>

              <div className="portal-field">
                <span className="portal-label">Deck</span>
                <label
                  className={`portal-drop${dragging ? ' is-active' : ''}${file ? ' has-file' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]); }}
                >
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx"
                    onChange={(e) => pickFile(e.target.files[0])}
                    disabled={busy}
                  />
                  <span className="portal-drop-icon">
                    {file ? <FileText size={22} /> : <UploadCloud size={22} />}
                  </span>
                  <span className="portal-drop-title">{file ? file.name : 'Drop your file or browse'}</span>
                  <span className="portal-drop-meta">
                    {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB · tap to replace` : 'PDF, PPT or PPTX · up to 25 MB'}
                  </span>
                </label>
              </div>
            </>
          )}

          {status === 'error' && (
            <div className="portal-alert portal-alert--error" role="alert">
              <AlertCircle size={18} />
              <span>{message}</span>
            </div>
          )}

          <button type="submit" className="portal-btn portal-btn--block" disabled={busy || (!appealing && (!teamId || !file))}>
            {busy ? (
              <><Loader2 size={18} className="portal-spin" /> {message}…</>
            ) : appealing ? (
              <>Send request <ArrowRight size={18} /></>
            ) : (
              <>Submit <ArrowRight size={18} /></>
            )}
          </button>
          {appealing && !busy && (
            <button type="button" className="portal-btn portal-btn--ghost portal-btn--block" onClick={reset}>Back</button>
          )}
        </form>
      </div>

      {!appealing && (
        <div className="portal-templates">
          <span>Templates</span>
          <a href="/assets/Product_Track_Template.pptx" download><Download size={14} /> Product Track</a>
          <a href="/assets/Prototype_Expo_Track_Template.pptx" download><Download size={14} /> Prototype Expo</a>
        </div>
      )}
    </PortalShell>
  );
}
