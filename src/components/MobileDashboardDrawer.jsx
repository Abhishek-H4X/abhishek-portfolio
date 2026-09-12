// src/components/MobileDashboardDrawer.jsx
// Mobile-only floating action button + full-screen overlay containing
// the career Dashboard timeline and Skills Matrix radar chart.

import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "../store";
import InteractiveSidebar from "./InteractiveSidebar";
import { useEffect } from "react";
import { useDialog } from "../hooks/useDialog";

// ─── Dashboard Icon (grid/chart icon) ───────────────────────────────────────
function DashboardIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Top-left square */}
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      {/* Top-right square */}
      <rect x="11" y="2" width="7" height="4" rx="1.5" />
      {/* Bottom-left rectangle */}
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      {/* Bottom-right tall rectangle */}
      <rect x="11" y="8" width="7" height="10" rx="1.5" />
    </svg>
  );
}

// ─── Close Icon ─────────────────────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 4L14 14M14 4L4 14" />
    </svg>
  );
}


export default function MobileDashboardDrawer() {
  const isOpen = useUIStore((s) => s.mobileDashboardOpen);
  const toggle = useUIStore((s) => s.toggleMobileDashboard);
  const close = useUIStore((s) => s.closeMobileDashboard);
  const drawerRef = useDialog(isOpen, close);
  useEffect(() => {
    const breakpoint = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (breakpoint.matches) close(); };
    breakpoint.addEventListener("change", closeOnDesktop);
    return () => breakpoint.removeEventListener("change", closeOnDesktop);
  }, [close]);

  return (
    <>
      {/* ── Floating Action Button — visible only < md ── */}
      <motion.button
        onClick={toggle}
        className="fixed bottom-20 right-4 z-40 flex md:hidden h-12 w-12 items-center justify-center rounded-full border border-synapse/40 bg-void/80 backdrop-blur-lg text-synapse shadow-glowCyan transition-colors hover:bg-synapse/20 hover:border-synapse/60 active:scale-95"
        aria-label={isOpen ? "Close dashboard" : "Open dashboard"}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        style={{
          boxShadow: "0 0 20px rgba(0, 210, 255, 0.25), 0 4px 15px rgba(0, 0, 0, 0.5)",
        }}
      >
        {isOpen ? <CloseIcon /> : <DashboardIcon />}
      </motion.button>

      {/* ── Full-screen Overlay Drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Scrim / backdrop */}
            <motion.div
              className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <motion.div
              className="fixed inset-0 z-[60] flex flex-col md:hidden"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              ref={drawerRef}
              tabIndex={-1}
              aria-modal="true"
              role="dialog"
              aria-label="Dashboard & Skills Matrix"
            >
              {/* Glass container */}
              <div
                className="flex flex-1 flex-col overflow-hidden"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(4, 6, 11, 0.97) 0%, rgba(9, 16, 30, 0.98) 100%)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                }}
              >
                {/* Header bar */}
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="font-mono text-[10px] text-mist/50">
                      mobile_dashboard.exe
                    </p>
                    <p className="font-display text-base font-medium text-white">
                      Dashboard & Skills
                    </p>
                  </div>
                  <button
                    onClick={close}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-mist transition-colors hover:border-white/30 hover:text-white"
                    aria-label="Close dashboard"
                  >
                    <CloseIcon />
                  </button>
                </div>

                {/* Scrollable content — InteractiveSidebar now includes SkillsRadar + ResumeUploader */}
                <div className="flex-1 overflow-y-auto scroll-thin">
                  <InteractiveSidebar />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
