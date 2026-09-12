// PipelinePanel.jsx — responsive career pipeline panel
//
// Desktop (≥ md): unchanged bottom-center glass bar
// Mobile (< md):  single motion.div with framer-motion `layout` prop
//                 that morphs in-place from pill → full-width bottom sheet.
//                 No teleporting, no separate DOM elements for the two states.
//
// Z-index strategy:
//   NavBar:               z-40
//   Desktop panel:        z-30
//   Mobile pill:          z-30
//   Mobile sheet backdrop:z-40
//   Mobile sheet:         z-[45]  (below SectionModal z-50)

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUIStore } from "../store";
import { useResumeStore } from "../hooks/useResumeData";
import PipelineProgress from "./PipelineProgress";
import { useDialog } from "../hooks/useDialog";

// Shared: animated reveal list of pipeline log lines
function PipelineLines({ PIPELINE_SUMMARY, pipelineRunning }) {
  return (
    <AnimatePresence>
      {pipelineRunning && (
        <motion.ul
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden border-t border-white/10 pt-3 mt-3 space-y-1.5"
        >
          {PIPELINE_SUMMARY.map((line, i) => (
            <motion.li
              key={line}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.28 }}
              className="flex gap-2 font-mono text-[10px] text-pulse/90 sm:text-[11px]"
            >
              <span className="text-mist">›</span>
              {line}
            </motion.li>
          ))}
        </motion.ul>
      )}
    </AnimatePresence>
  );
}

export default function PipelinePanel() {
  const pipelineRunning  = useUIStore((s) => s.pipelineRunning);
  const runPipeline      = useUIStore((s) => s.runPipeline);
  const setCursorVariant = useUIStore((s) => s.setCursorVariant);
  const PIPELINE_SUMMARY = useResumeStore((s) => s.data.PIPELINE_SUMMARY);

  const [expanded, setExpanded] = useState(false);
  const sheetRef = useDialog(expanded, () => setExpanded(false));
  useEffect(() => {
    const breakpoint = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (breakpoint.matches) setExpanded(false); };
    breakpoint.addEventListener("change", closeOnDesktop);
    return () => breakpoint.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <>
      {/* ─── Desktop: original bottom-center glass bar ─── */}
      <div className="glass-panel fixed bottom-16 left-1/2 z-30 hidden w-[92%] max-w-xl -translate-x-1/2 rounded-2xl p-3 sm:bottom-20 sm:p-4 md:block lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] text-mist">
              career_pipeline.run()
            </p>
            <p className="font-display text-xs text-white sm:text-sm">
              Trace the path from national service to Data Science
            </p>
          </div>
          <button
            onClick={runPipeline}
            onMouseEnter={() => setCursorVariant("hover")}
            onMouseLeave={() => setCursorVariant("default")}
            disabled={pipelineRunning}
            className="shrink-0 rounded-lg border border-synapse/50 bg-synapse/10 px-3 py-1.5 font-mono text-[10px] text-synapse transition-colors hover:bg-synapse/20 disabled:opacity-50 sm:px-4 sm:py-2 sm:text-xs"
          >
            {pipelineRunning ? "Running…" : "Run Algorithm"}
          </button>
        </div>
        <PipelineLines PIPELINE_SUMMARY={PIPELINE_SUMMARY} pipelineRunning={pipelineRunning} />
      </div>

      {/* ─── Mobile: single layout-animated element (pill → sheet) ─── */}

      {/* Backdrop — fades in/out independently */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="pipeline-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-void/60 md:hidden"
            onClick={() => setExpanded(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* The pill/sheet — single motion.div that morphs via layout prop */}
      <motion.div
        ref={sheetRef}
        tabIndex={0}
        aria-modal={expanded ? true : undefined}
        onKeyDown={(event) => {
          if (!expanded && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            setExpanded(true);
          }
        }}
        layout
        // Positioning changes drive the FLIP animation
        style={
          expanded
            ? {
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 45,
              }
            : {
                position: "fixed",
                bottom: "24px",
                left: "16px",
                zIndex: 30,
              }
        }
        className={`glass-panel md:hidden ${
          expanded ? "rounded-t-2xl" : "rounded-full cursor-pointer"
        }`}
        transition={{ layout: { type: "spring", damping: 28, stiffness: 280 } }}
        onClick={!expanded ? () => setExpanded(true) : undefined}
        role={expanded ? "dialog" : "button"}
        aria-label={expanded ? "Career pipeline" : "Open career pipeline"}
        aria-expanded={expanded}
      >
        {/* ── Pill content (collapsed) ── */}
        <AnimatePresence mode="wait" initial={false}>
          {!expanded ? (
            <motion.div
              key="pill-inner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-2 px-4 py-2"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-synapse animate-pulseGlow" />
              <span className="font-mono text-[11px] text-synapse">pipeline</span>
            </motion.div>
          ) : (
            /* ── Sheet content (expanded) ── */
            <motion.div
              key="sheet-inner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.18, duration: 0.2 }}
              className="p-5"
              // Safe area inset for phones with home indicator
              style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}
            >
              {/* Drag handle */}
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

              {/* Header + close */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] text-mist">career_pipeline.run()</p>
                  <p className="font-display mt-0.5 text-sm text-white">
                    Trace the path from national service to Data Science
                  </p>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="shrink-0 rounded-full border border-white/10 px-2 py-1 font-mono text-[10px] text-mist hover:text-white"
                  aria-label="Close pipeline panel"
                >
                  esc
                </button>
              </div>

              {/* Career milestone stepper */}
              <PipelineProgress />

              {/* Run button */}
              <button
                onClick={runPipeline}
                disabled={pipelineRunning}
                className="mt-4 w-full rounded-lg border border-synapse/50 bg-synapse/10 py-2.5 font-mono text-[11px] text-synapse transition-colors hover:bg-synapse/20 disabled:opacity-50"
              >
                {pipelineRunning ? "Running…" : "Run Algorithm"}
              </button>

              {/* Log lines */}
              <PipelineLines
                PIPELINE_SUMMARY={PIPELINE_SUMMARY}
                pipelineRunning={pipelineRunning}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
