import React from "react";

export default function RiskGauge({ report }) {
  if (!report) return null;
  const { score, tier, tierColor, explanation } = report;

  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="risk-gauge">
      <div className="risk-gauge__dial">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r="52" fill="none" stroke="#20242c" strokeWidth="10" />
          <circle
            cx="65"
            cy="65"
            r="52"
            fill="none"
            stroke={tierColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 65 65)"
            style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
          />
          <text x="65" y="60" textAnchor="middle" className="risk-gauge__score" fill="#f2f4f7">
            {score}
          </text>
          <text x="65" y="78" textAnchor="middle" className="risk-gauge__max mono" fill="#8b96a3">
            / 100
          </text>
        </svg>
      </div>
      <div className="risk-gauge__body">
        <span className="risk-gauge__tier mono" style={{ color: tierColor }}>
          {tier.toUpperCase()}
        </span>
        <p className="risk-gauge__explanation">{explanation}</p>
      </div>
    </div>
  );
}
