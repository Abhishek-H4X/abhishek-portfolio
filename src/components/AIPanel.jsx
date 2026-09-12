import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useResumeData } from "../hooks/useResumeData";
import { readChatStream } from "../lib/chatStream";
import { useDialog } from "../hooks/useDialog";
import { useUIStore } from "../store";

// ─── Match mode helper (still a plain POST → JSON) ────────────────────────────
async function postMatch(payload) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// ─── Score ring (unchanged) ───────────────────────────────────────────────────
function ScoreRing({ score }) {
  const clamped = Math.max(0, Math.min(100, score ?? 0));
  const circumference = 2 * Math.PI * 26;
  const offset = circumference - (clamped / 100) * circumference;
  const color =
    clamped >= 70 ? "#00FF87" : clamped >= 40 ? "#FFC857" : "#FF5C7A";

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span className="absolute font-mono text-sm font-semibold text-white">
        {clamped}
      </span>
    </div>
  );
}

// ─── Terminal log strip ───────────────────────────────────────────────────────
/**
 * Renders the real-time execution phase log lines above the assistant bubble.
 * Lines animate in one-by-one mimicking a terminal execution trace.
 */
function TerminalLog({ lines }) {
  if (lines.length === 0) return null;
  return (
    <div className="mb-2 rounded-lg border border-synapse/20 bg-slate-950/70 px-3 py-2 font-mono text-[10px] leading-relaxed">
      <p className="mb-1 text-mist/40 uppercase tracking-widest text-[9px]">
        › career_pipeline.run()
      </p>
      <AnimatePresence initial={false}>
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
            className="flex gap-1.5 text-synapse/70"
          >
            <span className="text-mist/30 select-none">›</span>
            {line}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Chat tab ─────────────────────────────────────────────────────────────────
function ChatTab() {
  const { PROFILE } = useResumeData();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! Ask me anything about ${PROFILE.name.split(" ")[0]}'s experience, skills, or projects — I'll answer straight from the resume.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Live terminal log lines shown while the stream is active
  const [terminalLines, setTerminalLines] = useState([]);
  // Partial (streaming) assistant reply being typed out
  const [streamingReply, setStreamingReply] = useState("");

  const scrollRef = useRef(null);
  // Keep a ref to the current AbortController so we can cancel on unmount
  const abortRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, streamingReply, terminalLines]);

  // Cleanup: abort any in-flight stream if the component unmounts
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);
    setTerminalLines([]);
    setStreamingReply("");

    // Abort any previous in-flight stream
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "chat", messages: next }),
        signal: controller.signal,
      });

      if (!res.ok) {
        // Non-SSE error (e.g., 400/500 before headers were sent)
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      let accumulated = "";
      await readChatStream(res, (event, payload) => {
        if (event === "log") setTerminalLines((prev) => [...prev, payload.text]);
        if (event === "token") {
          accumulated += payload.text;
          setStreamingReply(accumulated);
        }
      });
      if (!accumulated.trim()) throw new Error("No answer was received. Please try again.");
      setMessages((previous) => [...previous, { role: "assistant", content: accumulated }]);
      setStreamingReply("");
      setTerminalLines([]);

    } catch (err) {
      if (err.name === "AbortError") return; // user navigated away — silent
      setError(err.message);
      setStreamingReply("");
      setTerminalLines([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl whitespace-pre-wrap px-3 py-2 text-[13px] leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-synapse/20 text-white"
                : "bg-white/5 text-mist"
            }`}
          >
            {m.content}
          </div>
        ))}

        {/* Live terminal log + streaming bubble */}
        {loading && (
          <div className="max-w-[85%]">
            <TerminalLog lines={terminalLines} />
            {streamingReply ? (
              <div className="rounded-xl bg-white/5 px-3 py-2 text-[13px] leading-relaxed text-mist">
                {streamingReply}
                {/* Blinking cursor */}
                <span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-synapse/70 align-middle" />
              </div>
            ) : (
              <div className="rounded-xl bg-white/5 px-3 py-2 text-[13px] text-mist/70 animate-pulseGlow">
                thinking…
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-ember/40 bg-ember/10 px-3 py-2 text-[12px] text-ember">
            {error}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-700/50 bg-slate-900/80 p-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 pr-14 sm:pr-0">
          <input
            aria-label="Ask about the resume"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="e.g. Does he have any AI/ML experience?"
            className="min-w-0 flex-grow rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white placeholder:text-mist/50 focus:border-synapse/50 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={loading}
            className="flex-shrink-0 rounded-lg bg-synapse/20 px-4 py-2 font-mono text-[11px] font-semibold text-synapse transition-colors hover:bg-synapse/30 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Match tab (unchanged logic, still plain POST) ────────────────────────────
function MatchTab() {
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async () => {
    if (!jd.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await postMatch({ mode: "match", jobDescription: jd });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col p-4">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-mist/70">
        Paste a job description
      </p>
      <textarea
        aria-label="Job description"
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        placeholder="Paste the role's requirements here…"
        className="scroll-thin h-24 shrink-0 resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white placeholder:text-mist/50 focus:border-synapse/50 focus:outline-none"
      />
      <button
        onClick={analyze}
        disabled={loading}
        className="mt-2 shrink-0 rounded-lg bg-signal/20 px-3 py-2 font-mono text-[11px] text-signal transition-colors hover:bg-signal/30 disabled:opacity-40"
      >
        {loading ? "Analyzing…" : "Analyze fit"}
      </button>

      <div className="scroll-thin mt-4 flex-1 overflow-y-auto">
        {error && (
          <div className="rounded-xl border border-ember/40 bg-ember/10 px-3 py-2 text-[12px] text-ember">
            {error}
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pb-2"
            >
              {result.notice && <p role="status" className="text-sm text-mist">{result.notice}</p>}
              {Number.isFinite(result.score) && <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                <ScoreRing score={result.score} />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-mist/70">
                    Fit score
                  </p>
                  <p className="text-[13px] text-white">{result.pitch}</p>
                </div>
              </div>}

              {result.matched?.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-pulse/80">
                    Matches
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matched.map((m, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-pulse/30 bg-pulse/10 px-2.5 py-1 text-[11px] text-pulse"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.gaps?.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-ember/80">
                    Growth areas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.gaps.map((g, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-ember/30 bg-ember/10 px-2.5 py-1 text-[11px] text-ember"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Root panel (unchanged layout) ───────────────────────────────────────────
export default function AIPanel() {
  const { PROFILE } = useResumeData();
  const open = useUIStore((s) => s.aiPanelOpen);
  const toggle = useUIStore((s) => s.toggleAiPanel);
  const close = useUIStore((s) => s.closeAiPanel);
  const [tab, setTab] = useState("chat");
  const panelRef = useDialog(open, close, false);

  return (
    <>
      {/* Floating Corner Circle Trigger */}
      <motion.button
        onClick={toggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-synapse/50 bg-slate-900/80 text-synapse shadow-[0_0_15px_rgba(0,210,255,0.4)] backdrop-blur-md transition-colors hover:bg-slate-800 sm:bottom-6 sm:right-6"
        aria-label="Toggle AI Assistant"
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
        <span className="absolute right-1 top-1 h-3 w-3 animate-pulseGlow rounded-full bg-synapse" />
      </motion.button>

      {/* Glassmorphic Chat Overlay Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="AI Assistant"
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="glass-panel fixed bottom-20 right-4 z-40 flex h-[480px] max-h-[75vh] w-[calc(100vw-2rem)] max-w-[360px] flex-col overflow-hidden rounded-2xl shadow-2xl sm:bottom-24 sm:right-6 md:max-w-md"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/40 p-4 pb-3">
              <div>
                <p className="font-display text-sm font-semibold text-white">
                  AI Assistant
                </p>
                <p className="font-mono text-[10px] text-mist/70">
                  grounded in {PROFILE.name.split(" ")[0]}'s resume data
                </p>
              </div>
              <button
                onClick={close}
                className="hidden rounded-full p-1 text-mist/60 hover:text-white sm:block"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex shrink-0 gap-1 border-b border-white/10 bg-slate-900/40 px-4 py-2 font-mono text-[11px]">
              <button
                onClick={() => setTab("chat")}
                className={`flex-1 rounded-md py-1.5 transition-colors ${
                  tab === "chat"
                    ? "bg-synapse/20 text-synapse"
                    : "text-mist hover:text-white"
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setTab("match")}
                className={`flex-1 rounded-md py-1.5 transition-colors ${
                  tab === "match"
                    ? "bg-signal/20 text-signal"
                    : "text-mist hover:text-white"
                }`}
              >
                Job Match
              </button>
            </div>

            {/* Content Area */}
            <div className="min-h-0 flex-1 bg-slate-900/20">
              {tab === "chat" ? <ChatTab /> : <MatchTab />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
