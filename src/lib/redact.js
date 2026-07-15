/**
 * redact.js
 * ---------
 * Draws the original image onto a canvas, then paints solid "redaction bars"
 * (with a small stamped category label, like a classified document) over
 * every bounding box supplied. Padding is added around each OCR box so the
 * bar fully covers character ascenders/descenders and anti-aliased edges.
 */

const PADDING_X = 6;
const PADDING_Y = 4;

export function loadImage(fileOrUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    if (typeof fileOrUrl === "string") {
      img.src = fileOrUrl;
    } else {
      img.src = URL.createObjectURL(fileOrUrl);
    }
  });
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement} img
 * @param {Array<{box:object,label:string,color:string}>} matches
 * @param {{stamp?: boolean}} opts
 */
export function drawRedacted(canvas, img, matches, opts = {}) {
  const { stamp = true } = opts;
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const fontSize = Math.max(10, Math.round(canvas.width / 90));

  for (const m of matches) {
    const { x0, y0, x1, y1 } = m.box;
    const rx = x0 - PADDING_X;
    const ry = y0 - PADDING_Y;
    const rw = x1 - x0 + PADDING_X * 2;
    const rh = y1 - y0 + PADDING_Y * 2;

    // Solid bar
    ctx.fillStyle = "#05060a";
    ctx.fillRect(rx, ry, rw, rh);

    // Thin colored edge so the category is scannable at a glance
    ctx.strokeStyle = m.color;
    ctx.lineWidth = Math.max(1, fontSize / 8);
    ctx.strokeRect(rx, ry, rw, rh);

    if (stamp && rw > fontSize * 3) {
      ctx.fillStyle = m.color;
      ctx.font = `700 ${fontSize}px "JetBrains Mono", monospace`;
      ctx.textBaseline = "middle";
      const label = m.label.toUpperCase();
      const metrics = ctx.measureText(label);
      if (metrics.width < rw - 8) {
        ctx.fillText(label, rx + (rw - metrics.width) / 2, ry + rh / 2);
      }
    }
  }
}

export function canvasToBlob(canvas, type = "image/png") {
  return new Promise((resolve) => canvas.toBlob(resolve, type, 0.95));
}
