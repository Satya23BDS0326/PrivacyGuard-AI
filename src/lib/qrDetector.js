/**
 * qrDetector.js
 * -------------
 * Detects QR codes in an image using jsQR — pure JS, runs synchronously
 * against raw pixel data with no network calls or native binaries.
 * QR codes are flagged (not decoded-and-trusted) because they can encode
 * UPI IDs, phone numbers, vCards, or tracking links that people don't
 * realize are embedded in a screenshot.
 */

import jsQR from "jsqr";

/**
 * @param {HTMLCanvasElement} sourceCanvas - canvas already holding the source image
 * @returns {Array<{id:"QRCODE", label:string, color:string, box:object, value:string}>}
 */
export function detectQRCodes(sourceCanvas, opts = {}) {
  const { maxCodes = 4 } = opts;
  const ctx = sourceCanvas.getContext("2d");
  const { width, height } = sourceCanvas;

  // jsQR only ever returns the first QR code it finds in a frame. To catch
  // more than one (e.g. a UPI QR plus a WiFi-sharing QR in the same
  // screenshot) we scan, blank out the region we just found, and rescan
  // against a scratch copy of the pixel buffer.
  const working = ctx.getImageData(0, 0, width, height);
  const results = [];

  for (let i = 0; i < maxCodes; i++) {
    const found = jsQR(working.data, width, height, { inversionAttempts: "attemptBoth" });
    if (!found || !found.location) break;

    const xs = [
      found.location.topLeftCorner.x,
      found.location.topRightCorner.x,
      found.location.bottomLeftCorner.x,
      found.location.bottomRightCorner.x,
    ];
    const ys = [
      found.location.topLeftCorner.y,
      found.location.topRightCorner.y,
      found.location.bottomLeftCorner.y,
      found.location.bottomRightCorner.y,
    ];
    const box = {
      x0: Math.max(0, Math.min(...xs)),
      y0: Math.max(0, Math.min(...ys)),
      x1: Math.min(width, Math.max(...xs)),
      y1: Math.min(height, Math.max(...ys)),
    };

    results.push({
      id: "QRCODE",
      label: "QR Code",
      color: "#f472b6",
      value: found.data?.slice(0, 40) || "(encoded data)",
      box,
    });

    // Blank the found region (white-out) in the scratch buffer so the next
    // jsQR pass can't re-detect the same code.
    blankRegion(working, box, width);
  }

  return results;
}

function blankRegion(imageData, box, width) {
  const { x0, y0, x1, y1 } = box;
  for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
    for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
      const idx = (y * width + x) * 4;
      imageData.data[idx] = 255;
      imageData.data[idx + 1] = 255;
      imageData.data[idx + 2] = 255;
      imageData.data[idx + 3] = 255;
    }
  }
}
