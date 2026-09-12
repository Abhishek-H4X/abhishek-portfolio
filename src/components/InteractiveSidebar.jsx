// src/components/InteractiveSidebar.jsx
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeStore, refreshResumeData, applySavedResume } from "../hooks/useResumeData";
import { useUIStore, selectIsAdmin } from "../store";
import SkillsRadar from "./SkillsRadar";
import ResumeUploader from "./ResumeUploader";

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 transition-colors cursor-pointer" aria-hidden="true">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}

// Extract URL from string if present
function extractGithubLink(text) {
  const match = text.match(/https:\/\/github\.com\/[\w-]+\/[\w-]+/);
  return match ? match[0] : null;
}

export default function InteractiveSidebar() {
  const { data, draft, revision, setDraft } = useResumeStore();
  const { SKILLS, PIPELINE_SUMMARY, NODES } = data;
  
  const openSection = useUIStore((s) => s.openSection);
  const setFocusTarget = useUIStore((s) => s.setFocusTarget);
  const isAdmin = useUIStore(selectIsAdmin);
  const editToken = useUIStore((s) => s.editToken);
  const setEditToken = useUIStore((s) => s.setEditToken);
  const clearEditToken = useUIStore((s) => s.clearEditToken);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  useEffect(() => {
    if (isEditMode && isAdmin && !draft) setDraft({ summary: [...PIPELINE_SUMMARY], revision });
  }, [isEditMode, isAdmin, draft, PIPELINE_SUMMARY, revision, setDraft]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/edit-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode })
      });
      const json = await res.json();
      if (res.ok && json.token) {
        setEditToken(json.token);
        setPasscode("");
      } else {
        setAuthError(json.error || "Auth failed");
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleSave = async () => {
    if (!draft || isSaving) return;
    setIsSaving(true);
    setSaveNotice("");
    try {
      const res = await fetch("/api/resume-update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + editToken },
        body: JSON.stringify({ data: { PIPELINE_SUMMARY: draft.summary }, expectedRevision: draft.revision }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (res.status === 401) clearEditToken();
        throw new Error(result.error || "Save failed. Your draft has been kept.");
      }
      applySavedResume(result);
      setDraft({ summary: [...result.data.PIPELINE_SUMMARY], revision: result.revision });
      setSaveNotice("Changes saved.");
    } catch (err) {
      setSaveNotice(err.message);
    } finally { setIsSaving(false); }
  };

  const discardAndReload = async () => {
    const refreshed = await refreshResumeData();
    if (!refreshed) { setSaveNotice("Could not reload. Your draft has been kept."); return; }
    const state = useResumeStore.getState();
    setDraft({ summary: [...state.data.PIPELINE_SUMMARY], revision: state.revision });
    setSaveNotice("Loaded the latest saved resume.");
  };

  const handlePipelineChange = (index, value) => {
    if (!draft) return;
    setDraft({ ...draft, summary: draft.summary.map((entry, i) => i === index ? value : entry) });
    setSaveNotice("");
  };

  return (
    <div className="h-full w-full flex flex-col p-6 overflow-y-auto scroll-thin">
      {/* Header & Edit Toggle */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="font-mono text-[10px] text-mist mb-1">interactive_visualizer.exe</p>
          <p className="font-display text-lg text-white font-medium">Dashboard</p>
        </div>
        <button 
          onClick={() => setIsEditMode(!isEditMode)}
          className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] transition-colors ${
            isEditMode ? "bg-synapse/20 border-synapse text-synapse shadow-[0_0_10px_rgba(0,210,255,0.3)]" : "border-white/10 text-mist hover:text-white"
          }`}
        >
          {isEditMode ? "Exit Edit Mode" : "Edit Mode"}
        </button>
      </div>

      {/* Auth Prompt if Edit Mode clicked but no token */}
      <AnimatePresence>
        {isEditMode && !isAdmin && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAuth}
            className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3"
          >
            <p className="text-xs text-red-200 mb-2 font-mono">Requires authentication</p>
            <div className="flex gap-2">
              <input 
                type="password"
                placeholder="Passcode..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="flex-1 rounded border border-white/20 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-red-500/50"
              />
              <button type="submit" className="rounded bg-red-500/20 px-3 py-1 text-xs text-red-300 hover:bg-red-500/30">
                Unlock
              </button>
            </div>
            {authError && <p className="text-[10px] text-red-400 mt-2">{authError}</p>}
          </motion.form>
        )}
      </AnimatePresence>

      {/* Save Button (only visible if Authed and in Edit Mode) */}
      <AnimatePresence>
        {isEditMode && isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 flex gap-2"
          >
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-2 rounded-lg bg-pulse/20 border border-pulse/50 text-pulse font-mono text-xs hover:bg-pulse/30 transition-colors shadow-[0_0_10px_rgba(0,255,135,0.2)] disabled:opacity-50"
            >
              {isSaving ? "Saving to Gist..." : "Save Changes to Gist"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>



      {isEditMode && isAdmin && (
        <button onClick={discardAndReload} disabled={isSaving} className="mb-3 text-left text-sm text-mist underline">
          Discard draft and reload saved resume
        </button>
      )}
      {saveNotice && <p role="status" aria-live="polite" className="mb-4 rounded-lg border border-white/20 p-3 text-sm text-white">{saveNotice}</p>}
      {/* Dynamic Timeline Editor */}
      <div className="flex-1 space-y-4">
        <p className="font-mono text-[9px] text-mist/40 uppercase mb-2">Career Pipeline</p>
        {(isEditMode && isAdmin && draft ? draft.summary : PIPELINE_SUMMARY).map((entry, index) => {
          const repoLink = extractGithubLink(entry);
          
          return (
            <div key={index} className="relative pl-4 border-l border-white/10">
              {/* Connector dot */}
              <div className="absolute left-[-4.5px] top-2 h-2 w-2 rounded-full bg-void border border-pulse" />
              
              {isEditMode && isAdmin ? (
                <div className="space-y-2">
                  <textarea
                    aria-label={"Career milestone " + (index + 1)}
                    value={entry}
                    onChange={(e) => handlePipelineChange(index, e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-md p-2 text-xs text-white font-mono focus:border-pulse/50 outline-none resize-none"
                    rows={3}
                  />
                </div>
              ) : (
                <div className="bg-white/5 rounded-lg p-3 border border-transparent hover:border-white/10 transition-colors">
                  <p className="text-xs text-mist/90 font-mono leading-relaxed">
                    {entry}
                  </p>
                  
                  {/* Glowing GitHub Icon anchor */}
                  {repoLink && (
                    <a 
                      href={repoLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-mono text-white/50 hover:text-white transition-colors group"
                    >
                      <span className="text-white/40 group-hover:text-pulse group-hover:drop-shadow-[0_0_5px_rgba(0,255,135,0.8)] transition-all">
                        <GithubIcon />
                      </span>
                      Source Repository
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Skills Matrix Radar — stacked below the timeline */}
      <div className="mt-6 pt-5 border-t border-white/10">
        <SkillsRadar />
      </div>

      {/* Resume Download / Upload — at the very bottom */}
      <ResumeUploader />
    </div>
  );
}
