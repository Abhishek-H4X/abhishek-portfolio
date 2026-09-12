// src/components/ResumeTrackerTimeline.jsx
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useResumeStore } from "../hooks/useResumeData";
import { useUIStore } from "../store";

// Map keywords in PIPELINE_SUMMARY to a specific 3D node
function mapEntryToNode(text, nodes) {
  const lower = text.toLowerCase();
  
  if (lower.includes("de-suung") || lower.includes("greencybertech") || lower.includes("intern")) {
    return nodes.find(n => n.id === "experience");
  }
  if (lower.includes("bca") || lower.includes("university") || lower.includes("school")) {
    return nodes.find(n => n.id === "education");
  }
  if (lower.includes("hr system") || lower.includes("agentic") || lower.includes("project")) {
    return nodes.find(n => n.id === "projects");
  }
  if (lower.includes("python") || lower.includes("data science core")) {
    return nodes.find(n => n.id === "skills");
  }
  // Default to profile/sun
  return nodes.find(n => n.id === "profile");
}

export default function ResumeTrackerTimeline() {
  const PIPELINE_SUMMARY = useResumeStore((s) => s.data.PIPELINE_SUMMARY);
  const NODES = useResumeStore((s) => s.data.NODES);
  
  const openSection = useUIStore((s) => s.openSection);
  const setFocusTarget = useUIStore((s) => s.setFocusTarget);
  const setHoveredNode = useUIStore((s) => s.setHoveredNode);
  const setCursorVariant = useUIStore((s) => s.setCursorVariant);
  const activeSection = useUIStore((s) => s.activeSection);

  const fingerprint = JSON.stringify(PIPELINE_SUMMARY);
  const prevFp = useRef(fingerprint);
  const [flashed, setFlashed] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (prevFp.current !== fingerprint) {
      prevFp.current = fingerprint;
      setFlashed(true);
      setKey(k => k + 1);
      const t = setTimeout(() => setFlashed(false), 1800);
      return () => clearTimeout(t);
    }
  }, [fingerprint]);

  const handleNodeClick = (node) => {
    if (!node) return;
    openSection(node.id);
  };

  return (
    <div className="h-full w-full flex flex-col p-6 overflow-y-auto scroll-thin">
      <div className="mb-8">
        <p className="font-mono text-[10px] text-mist mb-1">
          career_pipeline.run()
        </p>
        <p className="font-display text-lg text-white font-medium">
          Resume Tracker
        </p>
        <p className="text-sm text-mist/80 mt-1">
          Trace the path from national service to Data Science. Click a milestone to focus the 3D node.
        </p>
      </div>

      <motion.div
        className="flex-1 relative rounded-xl border p-4 -mx-4"
        animate={flashed
          ? { borderColor: ["rgba(255,255,255,0)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0)"] }
          : { borderColor: "rgba(255,255,255,0)" }
        }
        transition={{ duration: 1.5 }}
        key={key}
      >
        <div className="space-y-0">
          {PIPELINE_SUMMARY.map((entry, i) => {
            const isLast = i === PIPELINE_SUMMARY.length - 1;
            const mappedNode = mapEntryToNode(entry, NODES);
            
            // Use node color for the glow, fallback to synapse #00D2FF
            const color = mappedNode ? mappedNode.color : "#00D2FF";
            const isActive = activeSection === mappedNode?.id;

            const parts = entry.split(" — ");
            const tag = parts.length > 1 ? parts[0] : `Step ${i + 1}`;
            const text = parts.length > 1 ? parts.slice(1).join(" — ") : entry;

            return (
              <motion.div
                key={entry}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15, duration: 0.3, ease: "easeOut" }}
                className="relative pl-7 pb-8 group cursor-pointer"
                onClick={() => handleNodeClick(mappedNode)}
                onMouseEnter={() => {
                   if (mappedNode) setHoveredNode(mappedNode.id);
                   setCursorVariant("hover");
                }}
                onMouseLeave={() => {
                   setHoveredNode(null);
                   setCursorVariant("default");
                }}
              >
                {/* Vertical Line */}
                {!isLast && (
                  <div
                    className="absolute left-[9px] top-4 bottom-0 w-px transition-colors duration-300"
                    style={{
                      background: isActive 
                        ? `linear-gradient(to bottom, ${color}88 0%, ${color}22 100%)`
                        : `linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, transparent 100%)`,
                    }}
                  />
                )}

                {/* Dot */}
                <div
                  className="absolute left-0 top-1.5 h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center transition-all duration-300"
                  style={{
                    borderColor: isActive ? color : "rgba(255,255,255,0.3)",
                    background: isActive ? `${color}22` : "#04060B",
                    boxShadow: isActive ? `0 0 12px ${color}66` : "none",
                  }}
                >
                  <div 
                    className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                    style={{ background: isActive || isLast ? color : "transparent" }}
                  />
                </div>

                {/* Content Panel */}
                <div 
                  className={`rounded-lg p-3 transition-all duration-300 ${
                    isActive 
                      ? "bg-white/10 border border-white/20 shadow-lg" 
                      : "bg-white/5 border border-transparent group-hover:bg-white/10"
                  }`}
                  style={isActive ? { boxShadow: `0 0 20px ${color}15` } : {}}
                >
                  {/* Year tag */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span 
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded transition-colors duration-300"
                      style={{ 
                        background: isActive ? `${color}20` : "rgba(255,255,255,0.1)",
                        color: isActive ? color : "#8FA3C0"
                      }}
                    >
                      {tag}
                    </span>
                    {mappedNode && (
                      <span className="font-mono text-[9px] uppercase tracking-wider text-mist/50">
                        {mappedNode.label}
                      </span>
                    )}
                  </div>
                  
                  {/* Text */}
                  <p className={`font-mono text-[11px] leading-relaxed transition-colors duration-300 ${
                    isActive ? "text-white" : "text-mist/80 group-hover:text-mist"
                  }`}>
                    {text}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
