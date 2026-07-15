import React from "react";
import RiskGauge from "../components/RiskGauge.jsx";

export default function ReportPage({ risk, matches, fileName, onDownloadReport, onDownloadPackage, goToResults }) {
  if (!risk) return null;

  return (
    <div className="page page--narrow">
      <p className="hero__eyebrow mono">FULL ANALYSIS</p>
      <h1 className="page-title">Privacy Report</h1>
      <p className="page-sub mono">{fileName || "screenshot.png"} — scanned entirely on-device</p>

      <div className="report-card">
        <RiskGauge report={risk} />
      </div>

      <h2 className="section-title">Score breakdown</h2>
      <table className="breakdown-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Occurrences</th>
            <th>Base weight</th>
            <th>Contribution</th>
          </tr>
        </thead>
        <tbody>
          {risk.breakdown.length === 0 ? (
            <tr>
              <td colSpan={4} className="breakdown-table__empty">
                No risk factors detected.
              </td>
            </tr>
          ) : (
            risk.breakdown.map((b) => (
              <tr key={b.id}>
                <td>{labelFor(matches, b.id)}</td>
                <td className="mono">{b.count}</td>
                <td className="mono">{b.weight}</td>
                <td className="mono">+{b.contribution}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2 className="section-title">AI explanation</h2>
      <p className="report-explanation">{risk.explanation}</p>

      <div className="workspace__controls" style={{ marginTop: 24 }}>
        <button className="btn btn--primary" onClick={onDownloadReport}>
          Download report (.pdf)
        </button>
        <button className="btn btn--ghost" onClick={onDownloadPackage}>
          Download package (.zip)
        </button>
        <button className="btn btn--ghost" onClick={goToResults}>
          ← Back to results
        </button>
      </div>
    </div>
  );
}

function labelFor(matches, id) {
  const found = matches.find((m) => m.id === id);
  return found ? found.label : id;
}
