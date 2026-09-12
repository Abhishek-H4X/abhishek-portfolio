import { create } from "zustand";
import { NODES } from "./data/resumeData.js";
import { currentNodePosition } from "./lib/nodePositions.js";

function readStoredToken() {
  try {
    const token = sessionStorage.getItem("edit_token");
    if (!token) return null;
    const { exp } = JSON.parse(atob(token).split(".")[0]);
    if (Number.isFinite(exp) && exp > Date.now()) return token;
    sessionStorage.removeItem("edit_token");
  } catch { /* Browser storage may be disabled. */ }
  return null;
}

// Shared state between the 2D DOM UI (sidebar, modals, cursor) and the
// R3F canvas (nodes, camera rig, particle pipeline). Using zustand here
// instead of React Context because Canvas renders through a separate
// reconciler — a plain store avoids any context-bridging headaches.
export const useUIStore = create((set, get) => ({
  mode: "3d", // "3d" | "reader"
  setMode: (mode) => set({ mode, activeSection: null }),
  readerSection: null,
  navigateReader: (id) => set({ readerSection: { id }, activeSection: null }),

  activeSection: null,
  openSection: (id) => {
    if (get().mode === "reader") return get().navigateReader(id);
    const node = NODES.find((item) => item.id === id);
    if (node) set({ activeSection: id, focusTarget: currentNodePosition(id, node.position) });
  },
  closeSection: () => set({ activeSection: null }),

  hoveredNode: null,
  setHoveredNode: (id) => set({ hoveredNode: id }),

  cursorVariant: "default", // "default" | "hover"
  setCursorVariant: (variant) => set({ cursorVariant: variant }),

  pipelineRunning: false,
  runPipeline: () => {
    if (get().pipelineRunning) return;
    set({ pipelineRunning: true });
    setTimeout(() => set({ pipelineRunning: false }), 3600);
  },

  // Default focus target is the center of the solar system
  focusTarget: [0, 0, 0],
  setFocusTarget: (position) => set({ focusTarget: position }),

  aiPanelOpen: false,
  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  closeAiPanel: () => set({ aiPanelOpen: false }),

  mobileDashboardOpen: false,
  toggleMobileDashboard: () => set((s) => ({ mobileDashboardOpen: !s.mobileDashboardOpen })),
  closeMobileDashboard: () => set({ mobileDashboardOpen: false }),

  // ── Auth state (Edit Mode) ────────────────────────────────────────────────
  editToken: readStoredToken(),
  setEditToken: (token) => {
    try { sessionStorage.setItem("edit_token", token); } catch { /* Session memory still works. */ }
    set({ editToken: token });
  },
  clearEditToken: () => {
    try { sessionStorage.removeItem("edit_token"); } catch { /* Session memory still works. */ }
    set({ editToken: null });
  },
}));

// Derived selector — avoids re-renders when unrelated state changes
export const selectIsAdmin = (s) => !!s.editToken;
