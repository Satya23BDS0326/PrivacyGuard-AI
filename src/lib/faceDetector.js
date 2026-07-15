/**
 * faceDetector.js
 * ---------------
 * Wraps @mediapipe/tasks-vision's FaceDetector running on WASM — this is
 * the browser build of MediaPipe (not the Python package), so detection
 * happens entirely on-device via WebAssembly/WebGL, no server involved.
 *
 * The model file (short-range face detector, ~200KB) is fetched once from
 * Google's model CDN on first use and cached by the browser afterward.
 */

import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

let detectorPromise = null;

async function getDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(WASM_BASE);
      return FaceDetector.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "IMAGE",
        minDetectionConfidence: 0.5,
      });
    })();
  }
  return detectorPromise;
}

/**
 * @param {HTMLImageElement} img
 * @returns {Promise<Array<{id:"FACE", label:string, color:string, box:object, confidence:number}>>}
 */
export async function detectFaces(img) {
  try {
    const detector = await getDetector();
    const result = detector.detect(img);

    return (result.detections || []).map((d) => {
      const bb = d.boundingBox;
      return {
        id: "FACE",
        label: "Face",
        color: "#38bdf8",
        confidence: d.categories?.[0]?.score ?? 0,
        box: {
          x0: bb.originX,
          y0: bb.originY,
          x1: bb.originX + bb.width,
          y1: bb.originY + bb.height,
        },
      };
    });
  } catch (err) {
    // Face model may fail to load offline before first cache (no network,
    // strict CSP, etc.) — degrade gracefully rather than blocking the rest
    // of the scan pipeline.
    console.warn("Face detection unavailable:", err);
    return [];
  }
}

export async function terminateFaceDetector() {
  if (detectorPromise) {
    const detector = await detectorPromise;
    detector.close();
    detectorPromise = null;
  }
}
