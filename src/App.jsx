import { Suspense, useEffect } from "react";
import Scene from "./components/Scene";
import NavBar from "./components/NavBar";
import SectionModal from "./components/SectionModal";
import PipelinePanel from "./components/PipelinePanel";
import CustomCursor from "./components/CustomCursor";
import ReaderView from "./components/ReaderView";
import AIPanel from "./components/AIPanel";
import DataScienceBackground from "./components/DataScienceBackground";
import InteractiveSidebar from "./components/InteractiveSidebar";
import MobileDashboardDrawer from "./components/MobileDashboardDrawer";
import { useUIStore } from "./store";
import { initResumePolling, stopResumePolling } from "./hooks/useResumeData";

function CanvasLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <p className="font-mono text-xs text-synapse/70 animate-pulseGlow">
        loading constellation…
      </p>
    </div>
  );
}

export default function App() {
  const mode = useUIStore((s) => s.mode);

  // Start live resume polling once on mount
  useEffect(() => {
    initResumePolling();
    return stopResumePolling;
  }, []);

  return (
    <div className="relative h-[100dvh] w-full lg:h-screen lg:w-screen lg:overflow-hidden overflow-y-auto overflow-x-hidden bg-void">
      {/* Layer 0: Custom cursor (highest z) */}
      <CustomCursor />

      {/* Layer 1: Futuristic Data Science background (lowest z) */}
      <DataScienceBackground />

      {/* Layer 2: Top navigation bar (replaces Sidebar) */}
      <NavBar />

      {mode === "3d" ? (
        <>
          {/* Layer 3: Layout (3D + Tracker) */}
          <div className="relative z-10 flex flex-col lg:absolute lg:inset-0 lg:flex-row min-h-screen lg:min-h-0">
            {/* Left/Top: 3D Canvas */}
            <div className="relative w-full h-[100dvh] md:h-[65vh] lg:h-full lg:flex-1 shrink-0">
              <Suspense fallback={<CanvasLoader />}>
                <Scene />
              </Suspense>
            </div>

            {/* Right/Bottom: Resume Tracker Sidebar */}
            <div className="hidden md:flex w-full lg:w-[400px] shrink-0 lg:h-full relative z-20 border-t lg:border-t-0 lg:border-l border-white/10 bg-void/40 backdrop-blur-md pt-6 pb-12 lg:pt-12 lg:pb-0 lg:shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex-col">
              <InteractiveSidebar />
            </div>
          </div>

          {/* Layer 4: Helper text — offset top-16 to clear the 48px NavBar */}
          <div className="pointer-events-none fixed right-4 top-16 z-20 hidden sm:block sm:right-6 sm:top-16">
            <p className="glass-panel rounded-full px-3 py-1.5 font-mono text-[10px] text-mist">
              drag to orbit · click a node to explore
            </p>
          </div>

          {/* Layer 5: Modals and panels */}
          <SectionModal />
          <PipelinePanel />
        </>
      ) : (
        <ReaderView />
      )}

      {/* Layer 6: AI Assistant (always available) */}
      <AIPanel />

      {/* Layer 7: Mobile Dashboard drawer (mobile only) */}
      <MobileDashboardDrawer />
    </div>
  );
}
