/**
 * ocr.js
 * ------
 * Thin wrapper around Tesseract.js. Everything runs client-side via
 * WebAssembly — the image is never uploaded anywhere. We ask for word-level
 * bounding boxes because piiDetector.js needs precise rectangles to redact.
 *
 * The worker is lazily created and reinitialized when the requested OCR
 * language changes.
 */

import { createWorker } from "tesseract.js";

let workerPromise = null;
let currentLanguage = "eng";

async function createWorkerInstance(onProgress, language) {
  // Tesseract.js v5: createWorker() is itself async and already loads +
  // initializes the requested language — there is no separate .load() /
  // .loadLanguage() / .initialize() step like in the old v2 API.
  const worker = await createWorker(language, 1, {
    logger: (m) => {
      if (onProgress && m.status === "recognizing text") {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  currentLanguage = language;
  return worker;
}

async function getWorker(onProgress, language = "eng") {
  if (!workerPromise || currentLanguage !== language) {
    if (workerPromise) {
      const existing = await workerPromise;
      await existing.terminate();
      workerPromise = null;
    }

    workerPromise = createWorkerInstance(onProgress, language);
  }

  return workerPromise;
}

/**
 * Runs OCR on an image (File, Blob, or data URL / HTMLImageElement) and
 * returns flat word tokens with pixel-space bounding boxes.
 *
 * @param {File|Blob|string|HTMLImageElement} image
 * @param {(percent:number)=>void} [onProgress]
 * @param {string} [language]
 * @returns {Promise<{words: Array<{text:string,x0:number,y0:number,x1:number,y1:number,confidence:number}>, fullText: string}>}
 */
export async function runOCR(image, onProgress, language = "eng") {
  const worker = await getWorker(onProgress, language);
  const { data } = await worker.recognize(image);

  const words = (data.words || []).map((w) => ({
    text: w.text,
    x0: w.bbox.x0,
    y0: w.bbox.y0,
    x1: w.bbox.x1,
    y1: w.bbox.y1,
    confidence: w.confidence,
  }));

  return { words, fullText: data.text };
}

export async function terminateOCR() {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
  }
}
