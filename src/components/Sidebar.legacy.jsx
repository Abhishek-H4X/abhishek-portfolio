import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NODES, PROFILE } from "../data/resumeData";
import { useUIStore } from "../store";

export default function Sidebar() {
  const mode = useUIStore((s) => s.mode);
  const setMode = useUIStore((s) => s.setMode);
  const activeSection = useUIStore((s) => s.activeSection);
  const openSection = useUIStore((s) => s.openSection);
  const setFocusTarget = useUIStore((s) => s.setFocusTarget);
  const setHoveredNode = useUIStore((s) => s.setHoveredNode);
  const setCursorVariant = useUIStore((s) => s.setCursorVariant);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelect = (node) => {
    openSection(node.id);
    setFocusTarget(node.position);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="glass-panel fixed left-4 top-4 z-40 hidden w-[220px] rounded-2xl p-4 sm:left-6 sm:top-6 sm:block">
        <div>
          <p className="font-display text-sm font-semibold text-white">
            {PROFILE.name}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-mist">
            {PROFILE.location}
          </p>
        </div>

        <nav className="mt-4 flex flex-col gap-1">
          {NODES.map((node) => (
            <button
              key={node.id}
              onClick={() => handleSelect(node)}
              onMouseEnter={() => {
                setHoveredNode(node.id);
                setCursorVariant("hover");
              }}
              onMouseLeave={() => {
                setHoveredNode(null);
                setCursorVariant("default");
              }}
              className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                activeSection === node.id
                  ? "bg-white/10 text-white"
                  : "text-mist hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  background: node.color,
                  boxShadow: `0 0 6px ${node.color}`,
                }}
              />
              {node.label}
            </button>
          ))}
        </nav>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
          <div className="flex rounded-lg border border-white/10 p-0.5 font-mono text-[10px]">
            <button
              onClick={() => setMode("3d")}
              className={`rounded-md px-2 py-1 transition-colors ${
                mode === "3d" ? "bg-synapse/20 text-synapse" : "text-mist"
              }`}
            >
              3D
            </button>
            <button
              onClick={() => setMode("reader")}
              className={`rounded-md px-2 py-1 transition-colors ${
                mode === "reader" ? "bg-synapse/20 text-synapse" : "text-mist"
              }`}
            >
              Reader
            </button>
          </div>
        </div>

        <a
          href={PROFILE.resumeFile}
          download
          className="mt-3 flex w-full items-center justify-center rounded-lg border border-pulse/40 bg-pulse/10 px-3 py-2 text-center font-mono text-[11px] text-pulse transition-colors hover:bg-pulse/20"
        >
          Download PDF Resume
        </a>
      </aside>

      {/* Mobile top bar + hamburger */}
      <div className="glass-panel fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-4 py-3 sm:hidden"
           style={{ borderRadius: "0 0 12px 12px" }}>
        <div>
          <p className="font-display text-sm font-semibold text-white">
            {PROFILE.name}
          </p>
          <p className="font-mono text-[9px] text-mist">
            {PROFILE.location}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 p-0.5 font-mono text-[9px]">
            <button
              onClick={() => setMode("3d")}
              className={`rounded-md px-1.5 py-0.5 transition-colors ${
                mode === "3d" ? "bg-synapse/20 text-synapse" : "text-mist"
              }`}
            >
              3D
            </button>
            <button
              onClick={() => setMode("reader")}
              className={`rounded-md px-1.5 py-0.5 transition-colors ${
                mode === "reader" ? "bg-synapse/20 text-synapse" : "text-mist"
              }`}
            >
              Reader
            </button>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg border border-white/10 p-2 text-mist hover:text-white"
            aria-label="Toggle menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {mobileOpen ? (
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel fixed left-0 right-0 top-[52px] z-40 rounded-b-2xl p-3 sm:hidden"
          >
            <nav className="flex flex-col gap-1">
              {NODES.map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleSelect(node)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    activeSection === node.id
                      ? "bg-white/10 text-white"
                      : "text-mist hover:bg-white/5"
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      background: node.color,
                      boxShadow: `0 0 6px ${node.color}`,
                    }}
                  />
                  {node.label}
                </button>
              ))}
            </nav>
            <a
              href={PROFILE.resumeFile}
              download
              className="mt-2 flex w-full items-center justify-center rounded-lg border border-pulse/40 bg-pulse/10 px-3 py-2 text-center font-mono text-[11px] text-pulse"
            >
              Download PDF Resume
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
