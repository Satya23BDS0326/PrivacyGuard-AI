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
  onCopy,
  onRescan,
  goToReport,
  scanCount,
  currentScan,
  onSelectScan,
  scanNames,
  onCategoryShortcut,
  highlightedCategory,
}) {
  const activeMatches = matches.filter((m) => selectedKeys.has(m.key));

  return (
    <div className="page">
      <p className="hero__eyebrow mono">STEP 2 OF 2</p>
      <h1 className="page-title">Detection results</h1>
      {scanCount > 1 && (
        <div className="scan-tabs" style={{ marginBottom: 18 }}>
          {Array.from({ length: scanCount }, (_, index) => (
            <button
              key={index}
              type="button"
              className={`btn btn--ghost ${currentScan === index ? "btn--active" : ""}`}
              onClick={() => onSelectScan(index)}
            >
              {scanNames?.[index] ? `${index + 1}. ${scanNames[index]}` : `Screenshot ${index + 1}`}
            </button>
          ))}
        </div>
      )}

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
            <button className="btn btn--ghost" onClick={onCopy} disabled={activeMatches.length === 0 && matches.length > 0}>
              Copy redacted image
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
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[...new Set(matches.map((m) => m.id))].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn--ghost ${highlightedCategory === cat ? "btn--active" : ""}`}
                onClick={() => onCategoryShortcut(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <button className="btn btn--ghost btn--full" onClick={goToReport} style={{ marginTop: 16 }}>
            View full privacy report →
          </button>
        </div>
      </div>
    </div>
  );
}
