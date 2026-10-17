import React from 'react';
import { Puzzle, RefreshCw } from 'lucide-react';
import { SITE_NAME, SITE_TAGLINE } from '../utils/bangla.js';

export default function LandingHeader({ connectionStatus, reconnect }) {
  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <div className="landing-brand">
          <span className="landing-brand-icon" aria-hidden="true">
            <Puzzle size={27} strokeWidth={1.8} />
          </span>
          <div className="landing-brand-copy">
            <h1>{SITE_NAME}</h1>
            <p>{SITE_TAGLINE}</p>
          </div>
        </div>
        <div className="landing-connection">
          <span className="landing-connection-dot" aria-hidden="true" />
          <p role="status" aria-live="polite">
            {connectionStatus}
          </p>
          <button
            type="button"
            onClick={reconnect}
            title="আবার যুক্ত হোন"
            aria-label="আবার যুক্ত হোন"
            className="landing-reconnect"
          >
            <RefreshCw size={17} aria-hidden="true" />
            <span>আবার যুক্ত হোন</span>
          </button>
        </div>
      </div>
    </header>
  );
}
