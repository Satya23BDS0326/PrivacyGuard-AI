import React, { useCallback, useRef, useState } from "react";

const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".pdf"];

function isAcceptedFile(file) {
  const name = file.name?.toLowerCase() || "";
  const type = file.type?.toLowerCase() || "";
  return type.startsWith("image/") || type === "application/pdf" || ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export default function Uploader({ onFiles, disabled }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (fileList) => {
      const validFiles = Array.from(fileList || []).filter(isAcceptedFile);
      if (validFiles.length > 0) {
        onFiles(validFiles);
      }
    },
    [onFiles]
  );

  const openPicker = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div
      className={`uploader ${dragOver ? "uploader--drag" : ""} ${disabled ? "uploader--disabled" : ""}`}
      onDragEnter={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={(e) => {
        const next = e.relatedTarget;
        if (next && e.currentTarget.contains(next)) return;
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!disabled) handleFiles(e.dataTransfer?.files || []);
      }}
      onClick={openPicker}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          openPicker();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        hidden
        multiple
        onChange={(e) => {
          handleFiles(e.target.files || []);
          e.target.value = "";
        }}
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
      <p className="uploader__title">Drop screenshots or PDFs here, or click to upload</p>
      <p className="uploader__hint mono">PNG · JPG · WEBP · PDF — processed locally, never sent anywhere</p>
    </div>
  );
}
