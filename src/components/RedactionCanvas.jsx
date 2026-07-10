import React, { useEffect, useRef, useState } from "react";
import { drawRedacted } from "../lib/redact.js";

export default function RedactionCanvas({ image, matches, showOriginal }) {
  const canvasRef = useRef(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    if (showOriginal) {
      const canvas = canvasRef.current;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
    } else {
      drawRedacted(canvasRef.current, image, matches);
    }
    setDims({ w: image.naturalWidth, h: image.naturalHeight });
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
