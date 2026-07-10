import React from "react";

const FEATURES = [
  { label: "Aadhaar Numbers", weight: 30 },
  { label: "PAN Numbers", weight: 20 },
  { label: "Bank Account Numbers", weight: 20 },
  { label: "Faces", weight: 15 },
  { label: "Phone Numbers", weight: 15 },
  { label: "QR Codes", weight: 10 },
  { label: "Email Addresses", weight: 10 },
];

export default function Home({ goToUpload }) {
  return (
    <div className="page">
      <section className="hero">
        <p className="hero__eyebrow mono">OFFLINE PRIVACY PROTECTION SYSTEM</p>
        <h1 className="hero__title">
          Know what your screenshot <br />
          reveals — before you share it.
        </h1>
        <p className="hero__sub">
          PrivacyGuard AI scans images entirely on your device — OCR, face detection and QR decoding all
          run locally in your browser. It finds Aadhaar numbers, PAN numbers, phone numbers, emails, bank
          details, QR codes and faces, scores the exposure as a Privacy Risk Score, explains why in plain
          English, and blurs whatever you choose. Nothing is ever uploaded.
        </p>
        <button className="btn btn--primary btn--lg" onClick={goToUpload}>
          Scan a screenshot →
        </button>
      </section>

      <section className="feature-grid">
        {FEATURES.map((f) => (
          <div key={f.label} className="feature-card">
            <span className="feature-card__weight mono">+{f.weight}</span>
            <span className="feature-card__label">{f.label}</span>
          </div>
        ))}
      </section>

      <section className="how-it-works">
        <h2 className="section-title">How it works</h2>
        <ol className="steps">
          <li>
            <span className="steps__num mono">01</span>
            <div>
              <h3>Upload</h3>
              <p>Drop in a screenshot. It's decoded straight into browser memory — never sent anywhere.</p>
            </div>
          </li>
          <li>
            <span className="steps__num mono">02</span>
            <div>
              <h3>Scan</h3>
              <p>On-device OCR, regex-based PII matching, QR decoding and face detection all run in parallel.</p>
            </div>
          </li>
          <li>
            <span className="steps__num mono">03</span>
            <div>
              <h3>Score</h3>
              <p>Every finding is weighted into a 0–100 Privacy Risk Score with a plain-English explanation.</p>
            </div>
          </li>
          <li>
            <span className="steps__num mono">04</span>
            <div>
              <h3>Redact</h3>
              <p>Blur everything, or pick specific items, then download the cleaned image.</p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}
