import React from "react";
import Uploader from "../components/Uploader.jsx";

export default function UploadPage({ onFile, status, progress, progressStage, error }) {
  return (
    <div className="page page--narrow">
      <p className="hero__eyebrow mono">STEP 1 OF 2</p>
      <h1 className="page-title">Upload a screenshot</h1>
      <p className="page-sub">
        JPG, JPEG or PNG. The scan runs fully offline once the page and models are cached — you can test
        this by switching to airplane mode after the first scan.
      </p>

      <Uploader onFile={onFile} disabled={status === "processing"} />

      {status === "processing" && (
        <div className="progress-stack">
          <ProgressRow label="Reading text (OCR)" active={progressStage === "ocr"} pct={progress.ocr} />
          <ProgressRow label="Scanning for QR codes" active={progressStage === "qr"} pct={progress.qr} />
          <ProgressRow label="Detecting faces" active={progressStage === "faces"} pct={progress.faces} />
          <ProgressRow label="Matching sensitive patterns" active={progressStage === "pii"} pct={progress.pii} />
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

function ProgressRow({ label, pct = 0, active }) {
  return (
    <div className={`progress-row ${active ? "progress-row--active" : ""}`}>
      <span className="progress-row__label mono">{label}</span>
      <div className="progress-row__track">
        <div className="progress-row__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-row__pct mono">{pct}%</span>
    </div>
  );
}
