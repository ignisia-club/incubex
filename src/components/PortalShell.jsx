import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function PortalShell({ wide = false, hero = false, children }) {
  return (
    <main className={`portal${hero ? ' portal--hero' : ''}`}>
      <section className={`portal-shell${wide ? ' portal-shell--top' : ''}`}>
        {!wide && <img className="portal-art portal-art--sparkle" src="/assets/hero-poster-sparkle.png" width="349" height="349" alt="" aria-hidden="true" />}
        {!wide && <img className="portal-art portal-art--star" src="/assets/competition-star.png" width="673" height="762" alt="" aria-hidden="true" />}
        <div className={`portal-inner ${wide ? 'portal-inner--wide' : 'portal-inner--narrow'}`}>
          {children}
          <nav className="portal-return" aria-label="Return to main site">
            <a href="/" className="portal-back"><ArrowLeft size={16} aria-hidden="true" /> Back to INCUBEX</a>
          </nav>
        </div>
      </section>
    </main>
  );
}
