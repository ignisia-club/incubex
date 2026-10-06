import React, { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, ArrowRight, FileText } from 'lucide-react';

const TEAM_ID_PATTERN = /^INC-\d{5}$/;
const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXT = ['pdf', 'ppt', 'pptx'];
const MIME_BY_EXT = {
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

export default function Upload() {
  const [teamId, setTeamId] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error | appeal | appeal_success
  const [message, setMessage] = useState('');
  const [appealMessage, setAppealMessage] = useState('');

  const fail = (msg) => { setStatus('error'); setMessage(msg); };

  const pickFile = (picked) => {
    if (!picked) return;
    const ext = picked.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return fail('Only PDF, PPT or PPTX files are accepted.');
    if (picked.size > MAX_BYTES) return fail('File is larger than 25MB. Please compress it and try again.');
    setFile(picked);
    if (status === 'error') { setStatus('idle'); setMessage(''); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const id = teamId.trim().toUpperCase();
    if (!TEAM_ID_PATTERN.test(id)) return fail('Team ID must look like INC-12345 (5 digits).');
    if (!file) return fail('Please attach your pitch deck.');

    setStatus('uploading');
    setMessage('Verifying Team ID...');

    try {
      const { data: teamInfo, error: teamError } = await supabase.rpc('get_team_status', { p_team_id: id });

      if (teamError || !teamInfo || !teamInfo.exists) throw new Error('Invalid Team ID. Please check and try again.');
      
      if (teamInfo.submitted) {
        setStatus('appeal');
        setMessage(`You have already submitted a presentation (Status: ${teamInfo.approval_status.replace('_', ' ').toUpperCase()}).`);
        return;
      }

      setMessage('Uploading presentation...');
      const fileExt = file.name.split('.').pop().toLowerCase();
      // Path format <TEAM_ID>_<timestamp>.<ext> is enforced by storage + submissions RLS.
      const filePath = `${id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('incubex-ppts')
        .upload(filePath, file, { contentType: MIME_BY_EXT[fileExt], upsert: false });

      if (uploadError) throw new Error('Failed to upload file.');

      setMessage('Saving submission...');
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
        if (submitError.code === '23505') throw new Error('Your team has already submitted a presentation.');
        throw new Error('Failed to save submission record.');
      }

      setStatus('success');
      setMessage('');
    } catch (err) {
      console.error(err);
      fail(err.message || 'An unexpected error occurred.');
    }
  };

  const handleAppeal = async (e) => {
    e.preventDefault();
    if (!appealMessage.trim()) return fail('Please enter your appeal message.');
    
    setStatus('uploading');
    setMessage('Submitting appeal...');
    const { error } = await supabase.rpc('submit_appeal', {
      p_team_id: teamId.trim().toUpperCase(),
      p_message: appealMessage.trim()
    });

    if (error) {
      fail('Failed to submit appeal. Please try again later.');
    } else {
      setStatus('appeal_success');
    }
  };

  const reset = () => { setStatus('idle'); setTeamId(''); setFile(null); setMessage(''); };
  const busy = status === 'uploading';

  return (
    <main className="portal">
      <section className="portal-shell">
        <span className="portal-dot portal-dot--a" aria-hidden="true"></span>
        <span className="portal-dot portal-dot--b" aria-hidden="true"></span>

        <div className="portal-inner portal-inner--narrow">
          <header className="portal-head">
            <img className="portal-wordmark" src="/assets/incubex-wordmark.png" alt="INCUBEX" width="340" height="96" />
            <span className="portal-kicker">Final Round Submission</span>
            <h1 className="portal-title">Upload your <em>pitch deck</em></h1>
            <p className="portal-sub">Submit your team's final presentation for INCUBEX 2026. One submission per team.</p>
          </header>

          <div className="portal-card">
            {status === 'success' ? (
              <div className="portal-success">
                <div className="portal-success-icon"><CheckCircle2 size={34} /></div>
                <h2>Submission received</h2>
                <p>Your presentation has been securely uploaded. We'll be in touch with next steps.</p>
                <button type="button" className="portal-btn portal-btn--ghost" onClick={reset}>
                  Submit for another team
                </button>
              </div>
            ) : status === 'appeal_success' ? (
              <div className="portal-success">
                <div className="portal-success-icon"><CheckCircle2 size={34} /></div>
                <h2>Appeal Sent</h2>
                <p>We have received your request to resubmit. Our admins will review it.</p>
                <button type="button" className="portal-btn portal-btn--ghost" onClick={reset}>
                  Go Back
                </button>
              </div>
            ) : (
              <form className="portal-form" onSubmit={status === 'appeal' ? handleAppeal : handleUpload} noValidate>
                
                {status === 'appeal' ? (
                  <>
                    <div className="portal-alert portal-alert--error" style={{ marginBottom: '1rem' }}>
                      <AlertCircle size={18} />
                      <span>{message}</span>
                    </div>
                    <div className="portal-field">
                      <label className="portal-label">Request a Resubmission (Appeal)</label>
                      <textarea 
                        className="portal-input"
                        style={{ minHeight: '100px', resize: 'vertical' }}
                        placeholder="Explain why you need to resubmit your pitch deck..."
                        value={appealMessage}
                        onChange={(e) => setAppealMessage(e.target.value)}
                        disabled={busy}
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
                        className="portal-input"
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        spellCheck="false"
                        maxLength={9}
                        placeholder="INC-12345"
                        value={teamId}
                        onChange={(e) => setTeamId(e.target.value.toUpperCase())}
                        disabled={busy}
                        required
                      />
                      <span className="portal-hint">The 5-digit ID from your registration confirmation.</span>
                    </div>

                    <div className="portal-field">
                      <span className="portal-label">Pitch Deck</span>
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
                          {file ? <FileText size={24} /> : <UploadCloud size={24} />}
                        </span>
                        <span className="portal-drop-title">{file ? file.name : 'Drag & drop or click to browse'}</span>
                        <span className="portal-drop-meta">
                          {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB · click to replace` : 'PDF, PPT or PPTX · max 25MB'}
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

                <button type="submit" className="portal-btn portal-btn--block" disabled={busy || (status !== 'appeal' && (!teamId || !file))}>
                  {busy ? (
                    <><Loader2 size={18} className="portal-spin" /> {message}</>
                  ) : status === 'appeal' ? (
                    <>Submit Appeal <ArrowRight size={18} /></>
                  ) : (
                    <>Submit presentation <ArrowRight size={18} /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
