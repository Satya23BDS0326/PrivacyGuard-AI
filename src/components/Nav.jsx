import React from "react";

const LINKS = [
  { id: "home", label: "Home" },
  { id: "upload", label: "Upload Image" },
  { id: "results", label: "Detection Results" },
  { id: "report", label: "Privacy Report" },
];

export default function Nav({ page, setPage, hasScan, isOnline, deferredPrompt, onPromptInstall }) {
  return (
    <header className="header">
      <div className="header__brand" onClick={() => setPage("home")} role="button" tabIndex={0}>
        <span className="header__mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="10.5" width="16" height="10" rx="2" fill="#00e6a8" />
            <path d="M7 10.5V7a5 5 0 0 1 10 0v3.5" stroke="#00e6a8" strokeWidth="2" fill="none" />
          </svg>
        </span>
        <span className="header__name">
          PrivacyGuard<span className="header__accent">.AI</span>
        </span>
      </div>

      <nav className="nav">
        {LINKS.map((l) => {
          const disabled = (l.id === "results" || l.id === "report") && !hasScan;
          return (
            <button
              key={l.id}
              className={`nav__link ${page === l.id ? "nav__link--active" : ""}`}
              onClick={() => !disabled && setPage(l.id)}
              disabled={disabled}
            >
              {l.label}
            </button>
          );
        })}
      </nav>

      <div className="header__badge-group">
        <div className={`header__badge mono ${isOnline ? "" : "header__badge--offline"}`}>
          <span className="header__dot" />
          {isOnline ? "ONLINE — ON-DEVICE ONLY" : "OFFLINE MODE — LOCAL ONLY"}
        </div>
        <div className="header__badge header__badge--secondary mono">
          Network Status: Offline Capable
        </div>
        {deferredPrompt && (
          <button type="button" className="btn btn--ghost header__install" onClick={onPromptInstall}>
            Install App
          </button>
        )}
      </div>
    </header>
  );
}
