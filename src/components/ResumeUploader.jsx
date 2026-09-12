// src/components/ResumeUploader.jsx
// Dual-state component: Download PDF (public) + Upload CV dropzone (admin).
// Validates .pdf extension and 3MB limit. Shows spinner during upload
// and green checkmark on success.

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeData, applySavedResume } from "../hooks/useResumeData";
import { useUIStore, selectIsAdmin } from "../store";

// ─── Icons ──────────────────────────────────────────────────────────────────
function DownloadIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 10 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 1v7M2 6l3 3 3-3M1 11h8" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 10V3M4 5l3-3 3 3M1 12h12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-spin" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8.5L6.5 12L13 4" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="24" height="28" viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="opacity-40">
      <path d="M4 2h10l6 6v18a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" />
      <path d="M14 2v6h6" />
      <path d="M8 16h8M8 20h5" />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function ResumeUploader() {
  const { PROFILE } = useResumeData();
  const isAdmin = useUIStore(selectIsAdmin);
  const editToken = useUIStore((s) => s.editToken);
  const clearEditToken = useUIStore((s) => s.clearEditToken);

  const [showDropzone, setShowDropzone] = useState(false);
  const [uploadState, setUploadState] = useState("idle"); // idle | uploading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_SIZE = 3 * 1024 * 1024; // 3MB

  const validateFile = (file) => {
    if (!file) return "No file selected";
    if (!file.name.toLowerCase().endsWith(".pdf")) return "Only .pdf files are allowed";
    if (file.type && file.type !== "application/pdf") return "Only PDF files are accepted";
    if (file.size > MAX_SIZE) return `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum 3MB`;
    return null;
  };

  const uploadFile = useCallback(async (file) => {
    if (uploadState === "uploading") return;
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState("error");
      setErrorMsg(validationError);
      return;
    }

    setUploadState("uploading");
    setErrorMsg("");

    try {
      // Convert file to base64 data-URL
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/asset-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${editToken}`,
        },
        body: JSON.stringify({
          type: "resume",
          data: dataUrl,
          filename: file.name,
        }),
      });

      if (res.status === 401) {
        clearEditToken();
        throw new Error("Session expired. Please re-authenticate.");
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      setUploadState("success");
      applySavedResume(json);

      // Reset to idle after 3s
      setTimeout(() => {
        setUploadState("idle");
        setShowDropzone(false);
      }, 3000);
    } catch (err) {
      setUploadState("error");
      setErrorMsg(err.message);
    }
  }, [editToken, clearEditToken, uploadState]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="mt-6 pt-5 border-t border-white/10">
      {/* Download Button — always visible */}
      <div className="flex gap-2">
        <a
          href={PROFILE.resumeFile}
          download
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-pulse/40 bg-pulse/10 px-3 py-3 font-mono text-[11px] text-pulse transition-colors hover:bg-pulse/20"
          aria-label="Download PDF resume"
        >
          <DownloadIcon />
          Download PDF Resume
        </a>

        {/* Upload toggle button — admin only */}
        {isAdmin && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowDropzone((v) => !v)}
            className={`flex items-center justify-center rounded-lg border px-3 py-3 font-mono text-[11px] transition-colors ${
              showDropzone
                ? "border-synapse/50 bg-synapse/20 text-synapse"
                : "border-white/20 bg-white/5 text-mist hover:text-white hover:border-white/30"
            }`}
            aria-label="Upload new resume"
            title="Upload New CV"
          >
            <UploadIcon />
          </motion.button>
        )}
      </div>

      {/* Dropzone — admin only, toggled */}
      <AnimatePresence>
        {isAdmin && showDropzone && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className={`mt-3 rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                isDragOver
                  ? "border-synapse/60 bg-synapse/10"
                  : uploadState === "error"
                  ? "border-ember/40 bg-ember/5"
                  : uploadState === "success"
                  ? "border-pulse/40 bg-pulse/5"
                  : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => uploadState !== "uploading" && fileInputRef.current?.click()}
              role="button"
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  if (uploadState !== "uploading") fileInputRef.current?.click();
                }
              }}
              tabIndex={0}
              aria-label="Drop PDF file here or click to browse"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                aria-hidden="true"
              />

              {uploadState === "idle" && (
                <>
                  <div className="flex justify-center mb-2">
                    <FileIcon />
                  </div>
                  <p className="font-mono text-[11px] text-mist/80">
                    Drop your <span className="text-synapse">.pdf</span> resume here
                  </p>
                  <p className="font-mono text-[9px] text-mist/40 mt-1">
                    or click to browse · max 3MB
                  </p>
                </>
              )}

              {uploadState === "uploading" && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-synapse"><SpinnerIcon /></span>
                  <p className="font-mono text-[11px] text-synapse">Uploading…</p>
                </div>
              )}

              {uploadState === "success" && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-pulse"><CheckIcon /></span>
                  <p className="font-mono text-[11px] text-pulse">Resume updated!</p>
                </div>
              )}

              {uploadState === "error" && (
                <div className="flex flex-col items-center gap-2">
                  <p className="font-mono text-[11px] text-ember">{errorMsg}</p>
                  <p className="font-mono text-[9px] text-mist/40 mt-1">Click to try again</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
