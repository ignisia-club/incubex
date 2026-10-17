import React from 'react';
import { Archive } from 'lucide-react';
import PortalShell from '../components/PortalShell.jsx';

export default function Upload() {
  return (
    <PortalShell hero>
      <div className="upload-closed-wrap">
        <div className="upload-closed-card">
          <div className="upload-closed-icon-wrap">
            <Archive size={32} strokeWidth={1.5} />
          </div>

          <p className="upload-closed-label">INCUBEX 2025</p>

          <h1 className="upload-closed-title">Submission Period Closed</h1>

          <p className="upload-closed-body">
            The deadline for presentation deck submissions has passed. All
            received pitch decks have been forwarded to the evaluation panel
            and are currently under review.
          </p>

          <hr className="upload-closed-divider" />

          <p className="upload-closed-contact">
            For queries, reach the committee at{' '}
            <a href="mailto:ignisia@mitwpu.edu.in">ignisia@mitwpu.edu.in</a>
          </p>
        </div>
      </div>
    </PortalShell>
  );
}
