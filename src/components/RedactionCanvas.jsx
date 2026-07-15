import React, { useEffect, useRef, useState } from "react";
import { drawRedacted } from "../lib/redact.js";

export default function RedactionCanvas({ image, matches, showOriginal }) {
  const canvasRef = useRef(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      if (!image) {
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#999";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Image could not load", canvas.width / 2, canvas.height / 2);
        setDims({ w: 0, h: 0 });
        return;
      }

      if (showOriginal) {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
      } else {
        drawRedacted(canvas, image, matches || []);
      }
      setDims({ w: image.naturalWidth, h: image.naturalHeight });
    } catch (err) {
      console.error("Canvas render error:", err);
    }
  }, [image, matches, showOriginal]);

  return (
    <div className="canvas-frame">
      <canvas ref={canvasRef} className="canvas-frame__canvas" aria-label="Screenshot preview" />
      {dims.w > 0 && (
        <span className="canvas-frame__dims mono">
          {dims.w}×{dims.h}px
        </span>
      )}
    </div>
  );
}

export { RedactionCanvas };
