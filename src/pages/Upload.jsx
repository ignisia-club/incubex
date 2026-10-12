import React, { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, ArrowRight, FileText, Download } from 'lucide-react';
import PortalShell from '../components/PortalShell.jsx';

// INC-12345, or a Club OS team number (4-5 digits, leading zeros kept).
const TEAM_ID_PATTERN = /^(INC-\d{5}|\d{4,5})$/;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = ['pdf', 'ppt', 'pptx'];
const MIME_BY_EXT = {
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

const formatWhen = (d) => d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export default function Upload() {
  const [teamId, setTeamId] = useState('');
  const [teamPin, setTeamPin] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState(null);

  const fail = (msg) => { setStatus('error'); setMessage(msg); };

  const pickFile = (picked) => {
    if (status === 'uploading') return;
    if (!picked) return;
    setFile(null);
    const ext = picked.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return fail('Only PDF, PPT or PPTX files are accepted.');
    if (picked.size > MAX_BYTES) return fail('File is larger than 10 MB. Please compress it and try again.');
    if (picked.size === 0) return fail('This file is empty. Please choose a valid deck.');
    setFile(picked);
    if (status === 'error') { setStatus('idle'); setMessage(''); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const id = teamId.trim().toUpperCase();
    if (!TEAM_ID_PATTERN.test(id)) return fail('Enter the Team ID from your registration, e.g. 1003 or INC-12345.');
    if (!teamPin.trim()) return fail('Please enter your 8-digit Team PIN.');
    if (!file) return fail('Please attach your deck.');

    setStatus('uploading');
    setMessage('Verifying Team ID & PIN');

    try {
      const { data: teamInfo, error: teamError } = await supabase.rpc('get_team_status', { p_team_id: id, p_team_pin: teamPin.trim() });

      if (teamError) throw new Error('We couldn’t verify your team right now. Please try again.');
      if (!teamInfo?.exists) throw new Error('Incorrect Team ID or PIN. Please check and try again.');

      // A team may upload again: the newest deck counts, earlier ones are kept.
      const replaced = teamInfo.submitted && teamInfo.last_submitted_at ? new Date(teamInfo.last_submitted_at) : null;

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
      const { error: submitError } = await supabase.rpc('submit_deck', {
        p_team_id: id,
        p_team_pin: teamPin.trim(),
        p_file_path: filePath
      });

      if (submitError) {
        if (/limit/i.test(submitError.message || '')) throw new Error('Your team has reached the upload limit. Contact the organisers.');
        if (/PIN/i.test(submitError.message || '')) throw new Error('Incorrect Team ID or PIN. Please check and try again.');
        throw new Error('We couldn’t save your submission. Please try again.');
      }

      setReceipt({ teamId: id, fileName: file.name, at: new Date(), replaced });
      setStatus('success');
      setMessage('');
    } catch (err) {
      console.error(err);
      fail(err.message || 'Something went wrong. Please try again.');
    }
  };

  const reset = () => { setStatus('idle'); setTeamId(''); setTeamPin(''); setFile(null); setMessage(''); setReceipt(null); };
  const busy = status === 'uploading';

  if (status === 'success' && receipt) {
    return (
      <PortalShell hero>
        <div className="portal-card portal-success" role="status">
          <div className="portal-success-icon"><CheckCircle2 size={30} /></div>
          <h2>Deck received</h2>
          <dl className="portal-receipt">
            <div><dt>Team ID</dt><dd>{receipt.teamId}</dd></div>
            <div><dt>File</dt><dd>{receipt.fileName}</dd></div>
            <div><dt>Received</dt><dd>{formatWhen(receipt.at)}</dd></div>
            {receipt.replaced && <div><dt>Replaces</dt><dd>Upload from {formatWhen(receipt.replaced)}</dd></div>}
          </dl>
          <p className="portal-hint">Need to change it? Upload again with your Team ID and PIN. The latest upload counts.</p>
          <button type="button" className="portal-btn portal-btn--ghost portal-btn--block" onClick={reset}>Upload for another team</button>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell hero>
      <header className="portal-head">
        <span className="portal-wordmark" aria-label="INCUBEX">INCUBE<span>X</span></span>
        <h1 className="portal-title">Submit your deck</h1>
      </header>

      <div className="portal-card">
        <form className="portal-form" onSubmit={handleUpload} noValidate aria-busy={busy}>
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
                  <label className="portal-label" htmlFor="team-pin">Team PIN</label>
                  <input
                    id="team-pin"
                    className="portal-input portal-input--id"
                    type="text"
                    autoComplete="off"
                    spellCheck="false"
                    maxLength={8}
                    placeholder="8-digit PIN"
                    value={teamPin}
                    onChange={(e) => setTeamPin(e.target.value)}
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
                    aria-label="Presentation file"
                    accept=".pdf,.ppt,.pptx"
                    onChange={(e) => { pickFile(e.target.files[0]); e.target.value = ''; }}
                    disabled={busy}
                  />
                  <span className="portal-drop-icon">
                    {file ? <FileText size={22} /> : <UploadCloud size={22} />}
                  </span>
                  <span className="portal-drop-title">{file ? file.name : 'Drop your file or browse'}</span>
                  <span className="portal-drop-meta">
                    {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB · tap to replace` : 'PDF, PPT or PPTX · up to 10 MB'}
                  </span>
                </label>
              </div>

          {status === 'error' && (
            <div className="portal-alert portal-alert--error" role="alert">
              <AlertCircle size={18} />
              <span>{message}</span>
            </div>
          )}
          {busy && <p role="status" aria-live="polite">{message}… Please keep this page open.</p>}

          <button type="submit" className="portal-btn portal-btn--block" disabled={busy || !teamId || !teamPin || !file}>
            {busy ? (
              <><Loader2 size={18} className="portal-spin" /> {message}…</>
            ) : (
              <>Submit <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>

      <section className="portal-templates" aria-labelledby="template-heading">
          <h2 id="template-heading">Download your presentation template</h2>
          <div className="portal-template-options">
            <a href="/assets/Product_Track_Template.pptx" download>
              <Download size={20} aria-hidden="true" />
              <span><strong>Product Track</strong><small>Download PPTX template</small></span>
            </a>
            <a href="/assets/Prototype_Expo_Track_Template.pptx" download>
              <Download size={20} aria-hidden="true" />
              <span><strong>Prototype Expo</strong><small>Download PPTX template</small></span>
            </a>
          </div>
        </section>
    </PortalShell>
  );
}
