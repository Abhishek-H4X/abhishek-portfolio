import { create } from "zustand";
import { shallow } from "zustand/shallow";
import { NODES } from "../data/resumeData.js";
import { DEFAULT_DATA, CONTENT_KEYS, normalizeResume } from "../data/resumeSchema.js";

export const useResumeStore = create((set) => ({
  data: { ...normalizeResume(DEFAULT_DATA), NODES },
  revision: null, lastSynced: null, syncStatus: "idle", justUpdated: false,
  draft: null,
  setDraft: (draft) => set({ draft }),
  setData: (data) => set({ data }),
  updateData: (partial) => set((state) => ({ data: { ...state.data, ...partial } })),
}));
export const useResumeData = () => useResumeStore((state) => state.data);
export const useSyncStatus = () => useResumeStore((state) => ({
  lastSynced: state.lastSynced, syncStatus: state.syncStatus, justUpdated: state.justUpdated,
}), shallow);

const fingerprint = (data) => CONTENT_KEYS.map((key) => JSON.stringify(data[key])).join("|");
let pollTimer = null;
let flashTimer = null;
let requestSequence = 0;
let pendingRequest = null;

export function applyResumeSnapshot(json) {
  const meta = json._meta || { source: "static" };
  if (meta.source === "fallback") {
    // Retain the last successful data instead of reverting an edited resume.
    useResumeStore.setState({ syncStatus: "error" });
    return false;
  }
  const data = { ...normalizeResume(json), NODES };
  const changed = fingerprint(useResumeStore.getState().data) !== fingerprint(data);
  clearTimeout(flashTimer);
  useResumeStore.setState({
    data, revision: meta.revision || null,
    syncStatus: meta.source === "live" ? "synced" : "static",
    lastSynced: Date.now(), justUpdated: changed,
  });
  if (changed) flashTimer = setTimeout(() => useResumeStore.setState({ justUpdated: false }), 3000);
  return true;
}

export function applySavedResume(result) {
  // Ignore a polling request that started before this confirmed save.
  requestSequence++;
  pendingRequest?.abort();
  applyResumeSnapshot({ ...result.data, _meta: { source: "live", revision: result.revision } });
}

export async function refreshResumeData() {
  const sequence = ++requestSequence;
  pendingRequest?.abort();
  const controller = new AbortController();
  pendingRequest = controller;
  const timeout = setTimeout(() => controller.abort(), 12_000);
  useResumeStore.setState({ syncStatus: "syncing" });
  try {
    const response = await fetch("/api/resume-data", { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error("Resume fetch failed");
    const json = await response.json();
    if (sequence !== requestSequence) return false;
    return applyResumeSnapshot(json);
  } catch {
    if (sequence === requestSequence) useResumeStore.setState({ syncStatus: "error" });
    return false;
  } finally {
    clearTimeout(timeout);
    if (pendingRequest === controller) pendingRequest = null;
  }
}
export function initResumePolling() {
  if (pollTimer) return;
  void refreshResumeData();
  pollTimer = setInterval(() => { void refreshResumeData(); }, 60_000);
}
export function stopResumePolling() {
  clearInterval(pollTimer);
  clearTimeout(flashTimer);
  pollTimer = null;
  requestSequence++;
  pendingRequest?.abort();
}
