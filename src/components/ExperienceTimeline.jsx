// ExperienceTimeline.jsx
// Vertical timeline for EXPERIENCE entries.
// Each entry animates in with framer-motion stagger on mount.
// Reacts to live data changes by flashing a brief glow border.

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useResumeData } from "../hooks/useResumeData";

const ACCENT = "#00FF87"; // experience node color

export default function ExperienceTimeline() {
  const { EXPERIENCE } = useResumeData();
  
  const fingerprint = JSON.stringify(EXPERIENCE);
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

  return (
    <motion.div 
      className="mt-3 space-y-0 rounded-xl border p-2 -mx-2"
      animate={flashed
        ? { borderColor: ["rgba(0,255,135,0)", "rgba(0,255,135,0.7)", "rgba(0,255,135,0)"] }
        : { borderColor: "rgba(255,255,255,0)" }
      }
      transition={{ duration: 1.5 }}
      key={key}
    >
      {EXPERIENCE.map((job, i) => {
        const isLast = i === EXPERIENCE.length - 1;
        return (
          <motion.div
            key={`${job.org}-${job.dates}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.14, duration: 0.3, ease: "easeOut" }}
            className="relative pl-6 pb-6 mx-2"
          >
            {/* Vertical connector line (not on last item) */}
            {!isLast && (
              <div
                className="absolute left-[7px] top-4 bottom-0 w-px"
                style={{
                  background: `linear-gradient(to bottom, ${ACCENT}55 0%, transparent 100%)`,
                }}
              />
            )}

            {/* Timeline dot */}
            <div
              className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 flex-shrink-0"
              style={{
                borderColor: ACCENT,
                background: "#04060B",
                boxShadow: `0 0 8px ${ACCENT}88`,
              }}
            />

            {/* Content */}
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
              <p className="font-display text-sm font-medium text-white">
                {job.role}
              </p>
              <span
                className="rounded-full px-2 py-0.5 font-mono text-[10px]"
                style={{
                  background: `${ACCENT}18`,
                  color: ACCENT,
                  border: `1px solid ${ACCENT}30`,
                }}
              >
                {job.dates}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-[11px] text-mist/70">{job.org}</p>
            <ul className="mt-1.5 space-y-1">
              {job.points.map((pt) => (
                <li key={pt} className="flex gap-2 text-[12px] text-white/75">
                  <span
                    className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                    style={{ background: ACCENT }}
                  />
                  {pt}
                </li>
              ))}
            </ul>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
