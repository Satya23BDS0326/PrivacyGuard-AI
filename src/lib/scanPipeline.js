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

  report("ocr", 0);
  const [ocrResult, qrMatches, faceMatches] = await Promise.all([
    runOCR(file, (pct) => report("ocr", pct), opts.ocrLanguage).then((r) => {
      report("ocr", 100);
      return r;
    }),
    Promise.resolve().then(() => {
      report("qr", 50);
      const r = detectQRCodes(scratch);
      report("qr", 100);
      return r;
    }),
    (async () => {
      report("faces", 20);
      const r = await detectFaces(img);
      report("faces", 100);
      return r;
    })(),
  ]);

  report("pii", 50);
  const textMatches = detectPII(ocrResult.words, opts);
  report("pii", 100);

  const matches = [
    ...textMatches.map((m) => ({ ...m, source: "ocr" })),
    ...qrMatches.map((m) => ({ ...m, source: "qr" })),
    ...faceMatches.map((m) => ({ ...m, source: "face" })),
  ].map((m, i) => ({ ...m, key: `${m.id}-${i}` }));

  const risk = computeRiskReport(matches);

  return { matches, risk, fullText: ocrResult.fullText };
}
