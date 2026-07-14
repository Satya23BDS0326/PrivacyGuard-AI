/**
 * scanPipeline.js
 * ---------------
 * Single entry point that runs the full on-device privacy scan:
 *   1. OCR (Tesseract.js)          → word tokens + boxes
 *   2. Rule-based PII matching      → Aadhaar / PAN / phone / email / bank / IFSC
 *   3. QR code detection (jsQR)     → flags any embedded QR payload
 *   4. Face detection (MediaPipe)   → flags visible faces
 *   5. Risk scoring + explanation   → 0-100 score + plain-English reasoning
 *
 * Every step runs in-browser. Steps 3 and 4 run in parallel with step 1/2
 * since they don't depend on OCR output.
 */

import { runOCR } from "./ocr.js";
import { detectPII } from "./piiDetector.js";
import { detectQRCodes } from "./qrDetector.js";
import { detectFaces } from "./faceDetector.js";
import { computeRiskReport } from "./riskScore.js";

/**
 * @param {File} file
 * @param {HTMLImageElement} img - already-loaded image element for the same file
 * @param {(stage:string, percent:number)=>void} [onProgress]
 */
export async function scanImage(file, img, onProgress, opts = {}) {
  const report = (stage, pct) => onProgress?.(stage, pct);

  // Offscreen canvas for QR scanning (jsQR needs raw pixel data).
  const scratch = document.createElement("canvas");
  scratch.width = img.naturalWidth;
  scratch.height = img.naturalHeight;
  scratch.getContext("2d").drawImage(img, 0, 0);

  let ocrResult = { words: [], fullText: "" };
  let qrMatches = [];
  let faceMatches = [];
  let textMatches = [];

  try {
    report("ocr", 0);
    ocrResult = await runOCR(file, (pct) => report("ocr", pct), opts.ocrLanguage);
    report("ocr", 100);
  } catch (err) {
    console.warn("OCR failed:", err);
    report("ocr", 100);
  }

  try {
    report("qr", 50);
    qrMatches = detectQRCodes(scratch);
    report("qr", 100);
  } catch (err) {
    console.warn("QR detection failed:", err);
    report("qr", 100);
  }

  try {
    report("faces", 20);
    faceMatches = await detectFaces(img);
    report("faces", 100);
  } catch (err) {
    console.warn("Face detection failed:", err);
    report("faces", 100);
  }

  try {
    report("pii", 50);
    textMatches = detectPII(ocrResult.words, opts);
    report("pii", 100);
  } catch (err) {
    console.warn("PII detection failed:", err);
    report("pii", 100);
  }

  const matches = [
    ...textMatches.map((m) => ({ ...m, source: "ocr" })),
    ...qrMatches.map((m) => ({ ...m, source: "qr" })),
    ...faceMatches.map((m) => ({ ...m, source: "face" })),
  ].map((m, i) => ({ ...m, key: `${m.id}-${i}` }));

  const risk = computeRiskReport(matches);

  return { matches, risk, fullText: ocrResult.fullText };
}
