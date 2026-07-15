/**
 * riskScore.js
 * ------------
 * Turns a flat list of detections (text-based PII + QR + faces) into:
 *   1. a 0-100 "Privacy Risk Score"
 *   2. a risk tier label (Low / Medium / High / Critical)
 *   3. a plain-English explanation of *why* — this is the "AI
 *      Explainability" feature. It's a deterministic template composer
 *      (not an LLM call — everything stays on-device and offline), but it
 *      reads like a natural sentence because it's built from the same
 *      category data driving the rest of the UI.
 */

export const RISK_WEIGHTS = {
  AADHAAR: 30,
  PAN: 20,
  PHONE: 15,
  EMAIL: 10,
  BANK_ACCOUNT: 20,
  IFSC: 8,
  FACE: 15,
  QRCODE: 10,
};

const CATEGORY_PHRASES = {
  AADHAAR: "an Aadhaar number",
  PAN: "a PAN card number",
  PHONE: "a phone number",
  EMAIL: "an email address",
  BANK_ACCOUNT: "a bank account or card number",
  IFSC: "a bank IFSC code",
  FACE: "a visible human face",
  QRCODE: "an unscanned QR code",
};

const CATEGORY_PHRASES_PLURAL = {
  AADHAAR: "Aadhaar numbers",
  PAN: "PAN card numbers",
  PHONE: "phone numbers",
  EMAIL: "email addresses",
  BANK_ACCOUNT: "bank account or card numbers",
  IFSC: "bank IFSC codes",
  FACE: "human faces",
  QRCODE: "unscanned QR codes",
};

/**
 * @param {Array<{id:string}>} matches - merged detections (PII + QR + faces)
 * @returns {{score:number, tier:string, tierColor:string, explanation:string, breakdown:Array}}
 */
export function computeRiskReport(matches) {
  const counts = {};
  for (const m of matches) counts[m.id] = (counts[m.id] || 0) + 1;

  const breakdown = Object.entries(counts).map(([id, count]) => {
    const weight = RISK_WEIGHTS[id] || 0;
    // Diminishing returns: first occurrence counts full weight, repeats of
    // the same category count less (three phone numbers isn't 3x riskier
    // than one — it's the same category of exposure).
    const contribution = Math.round(weight * (1 + Math.log2(count) * 0.4));
    return { id, count, weight, contribution };
  });

  const rawScore = breakdown.reduce((sum, b) => sum + b.contribution, 0);
  const score = Math.max(0, Math.min(100, rawScore));

  const { tier, tierColor } = classify(score);
  const explanation = buildExplanation(counts, score, tier);

  return { score, tier, tierColor, explanation, breakdown };
}

function classify(score) {
  if (score === 0) return { tier: "Safe to share", tierColor: "#00e6a8" };
  if (score < 25) return { tier: "Low risk", tierColor: "#a3e635" };
  if (score < 50) return { tier: "Medium risk", tierColor: "#ffb020" };
  if (score < 75) return { tier: "High risk", tierColor: "#ff8a3d" };
  return { tier: "Critical risk", tierColor: "#ff5d5d" };
}

function buildExplanation(counts, score, tier) {
  const ids = Object.keys(counts);
  if (ids.length === 0) {
    return "No identifying information was detected in this image. It looks safe to share, but always double-check for anything an automated scan could miss.";
  }

  const phrases = ids.map((id) =>
    counts[id] > 1 ? `${counts[id]} ${CATEGORY_PHRASES_PLURAL[id] || id}` : CATEGORY_PHRASES[id] || id
  );

  const joined = joinWithAnd(phrases);
  const consequence =
    score >= 75
      ? "Sharing this image publicly could directly expose your identity, contact details, or finances to strangers."
      : score >= 50
        ? "Sharing this image publicly may expose personal identity or contact information."
        : score >= 25
          ? "This image contains some personal information — worth a second look before sharing widely."
          : "This image contains minor traces of personal information, but the exposure risk is limited.";

  return `This image contains ${joined}. ${consequence} (Privacy Risk: ${score}/100 — ${tier}.)`;
}

function joinWithAnd(items) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
