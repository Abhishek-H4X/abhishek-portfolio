// PipelineProgress.jsx
// Horizontal milestone stepper built from PIPELINE_SUMMARY entries.
// Each entry is parsed as "YEAR — description"; the year becomes the label.
// Displayed inside PipelinePanel's expanded view and reacts to live data changes.

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeStore } from "../hooks/useResumeData";

const ACCENT = "#00D2FF"; // synapse

/** Extract a short label from a pipeline entry string like "2022 — Started..." */
function shortLabel(entry) {
  const match = entry.match(/^(\d{4})/);
  return match ? match[1] : entry.slice(0, 8);
}

export default function PipelineProgress() {
  const PIPELINE_SUMMARY = useResumeStore((s) => s.data.PIPELINE_SUMMARY);
  const fingerprint = JSON.stringify(PIPELINE_SUMMARY);
  const prevFp = useRef(fingerprint);
  const [flashed, setFlashed] = useState(false);
  const [key, setKey] = useState(0); // bump to re-trigger stagger on data change

  useEffect(() => {
    if (prevFp.current !== fingerprint) {
      prevFp.current = fingerprint;
      setFlashed(true);
      setKey((k) => k + 1);
      const t = setTimeout(() => setFlashed(false), 1800);
      return () => clearTimeout(t);
    }
  }, [fingerprint]);

  if (!PIPELINE_SUMMARY?.length) return null;

  return (
    <motion.div
      className="mt-5 rounded-xl border p-3"
      animate={flashed
        ? { borderColor: ["rgba(0,210,255,0)", "rgba(0,210,255,0.7)", "rgba(0,210,255,0)"] }
        : { borderColor: "rgba(255,255,255,0.08)" }
      }
      transition={{ duration: 1.5 }}
    >
      <p className="mb-3 font-mono text-[9px] uppercase tracking-widest text-mist/40">
        career milestones
      </p>

      {/* Stepper row */}
      <div className="flex items-start" key={key}>
        {PIPELINE_SUMMARY.map((entry, i) => {
          const isLast = i === PIPELINE_SUMMARY.length - 1;
          return (
            <div key={entry} className="flex flex-1 flex-col items-center">
              {/* Connector + dot row */}
              <div className="flex w-full items-center">
                {/* Left connector line */}
                {i > 0 && (
                  <motion.div
                    className="h-px flex-1"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.14, duration: 0.3 }}
                    style={{ background: `linear-gradient(to right, ${ACCENT}50, ${ACCENT}30)` }}
                  />
                )}

                {/* Step dot */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.14 + 0.05, type: "spring", stiffness: 300, damping: 20 }}
                  className="h-2.5 w-2.5 shrink-0 rounded-full border"
                  style={{
                    borderColor: ACCENT,
                    background: i === PIPELINE_SUMMARY.length - 1 ? ACCENT : "#04060B",
                    boxShadow: `0 0 ${i === PIPELINE_SUMMARY.length - 1 ? "8" : "4"}px ${ACCENT}${i === PIPELINE_SUMMARY.length - 1 ? "aa" : "55"}`,
                  }}
                />

                {/* Right connector line */}
                {!isLast && (
                  <motion.div
                    className="h-px flex-1"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.14 + 0.08, duration: 0.3 }}
                    style={{ background: `linear-gradient(to right, ${ACCENT}30, ${ACCENT}50)` }}
                  />
                )}
              </div>

              {/* Year label */}
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.14 + 0.15 }}
                className="mt-1.5 text-center font-mono text-[9px] leading-tight"
                style={{ color: i === PIPELINE_SUMMARY.length - 1 ? ACCENT : "#8FA3C0" }}
              >
                {shortLabel(entry)}
              </motion.p>
            </div>
          );
        })}
      </div>

      {/* Current entry full text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={PIPELINE_SUMMARY[PIPELINE_SUMMARY.length - 1]}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-3 font-mono text-[10px] leading-relaxed text-mist/60"
        >
          <span style={{ color: ACCENT }}>▸ </span>
          {PIPELINE_SUMMARY[PIPELINE_SUMMARY.length - 1]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}
