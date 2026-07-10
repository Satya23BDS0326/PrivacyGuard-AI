import React, { useCallback, useRef, useState } from "react";

export default function Uploader({ onFile, disabled }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (fileList) => {
      const file = fileList?.[0];
      if (file && file.type.startsWith("image/")) {
        onFile(file);
      }
    },
    [onFile]
  );

  return (
    <div
      className={`uploader ${dragOver ? "uploader--drag" : ""} ${disabled ? "uploader--disabled" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
      <div className="uploader__icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="uploader__title">Drop a screenshot here, or click to upload</p>
      <p className="uploader__hint mono">PNG · JPG · WEBP — processed locally, never sent anywhere</p>
    </div>
  );
}
