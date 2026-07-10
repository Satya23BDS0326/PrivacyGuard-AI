import React from "react";
import RedactionCanvas from "../components/RedactionCanvas.jsx";
import RiskGauge from "../components/RiskGauge.jsx";

export default function ResultsPage({
  image,
  matches,
  risk,
  selectedKeys,
  onToggleMatch,
  onBlurAll,
  onBlurNone,
  showOriginal,
  onToggleOriginal,
  onDownload,
  onRescan,
  goToReport,
}) {
  const activeMatches = matches.filter((m) => selectedKeys.has(m.key));

  return (
    <div className="page">
      <p className="hero__eyebrow mono">STEP 2 OF 2</p>
      <h1 className="page-title">Detection results</h1>

      <div className="workspace">
        <div className="workspace__left">
          <RedactionCanvas image={image} matches={activeMatches} showOriginal={showOriginal} />
          <div className="workspace__controls">
            <button className="btn btn--ghost" onClick={onToggleOriginal}>
              {showOriginal ? "Show redacted" : "Show original"}
            </button>
            <button className="btn btn--ghost" onClick={onBlurAll}>
              Blur all
            </button>
            <button className="btn btn--ghost" onClick={onBlurNone}>
              Clear selection
            </button>
            <button className="btn btn--primary" onClick={onDownload} disabled={activeMatches.length === 0 && matches.length > 0}>
              Download redacted image
            </button>
            <button className="btn btn--ghost" onClick={onRescan}>
              Scan another
            </button>
          </div>

          {matches.length > 0 && (
            <div className="detection-list">
              <h3 className="detection-list__title">Detected items — choose what to blur</h3>
              <ul>
                {matches.map((m) => (
                  <li key={m.key} className="detection-list__row">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedKeys.has(m.key)}
                        onChange={() => onToggleMatch(m.key)}
                      />
                      <span className="detection-list__swatch" style={{ background: m.color }} />
                      <span className="detection-list__label">{m.label}</span>
                      {m.value && <span className="detection-list__value mono">{m.value}</span>}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="workspace__right">
          <RiskGauge report={risk} />
          <button className="btn btn--ghost btn--full" onClick={goToReport} style={{ marginTop: 16 }}>
            View full privacy report →
          </button>
        </div>
      </div>
    </div>
  );
}
