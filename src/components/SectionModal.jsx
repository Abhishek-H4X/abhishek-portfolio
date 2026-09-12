// SectionModal.jsx
// Reads live resume data from useResumeData() hook.
// Experience section → ExperienceTimeline visualization
// Skills section     → SkillsChart visualization
// Projects section   → GitHubActivity widget appended

import { AnimatePresence, motion } from "framer-motion";
import { useUIStore } from "../store";
import { useResumeData } from "../hooks/useResumeData";
import SkillsChart from "./SkillsChart";
import ExperienceTimeline from "./ExperienceTimeline";
import GitHubActivity from "./GitHubActivity";
import { useDialog } from "../hooks/useDialog";

// ─── Section content components ────────────────────────────────────────────────

function ProfileContent() {
  const { PROFILE } = useResumeData();
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-mist">{PROFILE.pitch}</p>
      <ul className="space-y-1.5">
        {PROFILE.highlights.map((h) => (
          <li key={h} className="flex gap-2 text-sm text-white/85">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-synapse" />
            {h}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2 pt-1">
        {PROFILE.email && (
          <a
            href={`mailto:${PROFILE.email}`}
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-white/80 transition-colors hover:border-synapse/40 hover:text-synapse"
          >
            Email
          </a>
        )}
        {PROFILE.github && (
          <a
            href={PROFILE.github}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-white/80 transition-colors hover:border-synapse/40 hover:text-synapse"
          >
            GitHub
          </a>
        )}
        {PROFILE.linkedin && (
          <a
            href={PROFILE.linkedin}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-white/80 transition-colors hover:border-synapse/40 hover:text-synapse"
          >
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}

function ExperienceContent() {
  // ExperienceTimeline reads useResumeData internally
  return <ExperienceTimeline />;
}

function ProjectsContent() {
  return (
    <div className="space-y-4">
      {/* Live GitHub activity now handles the entire Projects UI dynamically */}
      <GitHubActivity />
    </div>
  );
}

function SkillsContent() {
  const { SKILLS } = useResumeData();
  const groups = [...new Set(SKILLS.map((s) => s.group))];

  return (
    <div className="space-y-3">
      {/* Tag cloud (existing) */}
      {groups.map((group) => (
        <div key={group}>
          <p className="font-mono text-[10px] text-mist/70">{group}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {SKILLS.filter((s) => s.group === group).map((s) => (
              <span
                key={s.name}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[12px] text-white/85"
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* Bar chart visualization */}
      <SkillsChart />
    </div>
  );
}

function EducationContent() {
  const { EDUCATION, CERTIFICATIONS } = useResumeData();
  return (
    <div className="space-y-4">
      <div>
        {EDUCATION.map((ed) => (
          <div key={ed.school} className="mb-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <p className="font-display text-sm font-medium text-white">
                {ed.program}
              </p>
              <p className="font-mono text-[10px] text-pulse">{ed.dates}</p>
            </div>
            <p className="text-xs text-mist">{ed.school}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="mb-1.5 font-mono text-[10px] text-mist">
          Certifications &amp; Training
        </p>
        <ul className="space-y-1">
          {CERTIFICATIONS.map((cert) => (
            <li key={cert} className="flex gap-2 text-[13px] text-white/80">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-signal" />
              {cert}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Section map ───────────────────────────────────────────────────────────────
const SECTION_MAP = {
  profile:   { title: "Profile",                  Content: ProfileContent   },
  experience:{ title: "Experience",               Content: ExperienceContent },
  projects:  { title: "Projects",                 Content: ProjectsContent  },
  skills:    { title: "Skills",                   Content: SkillsContent    },
  education: { title: "Education / Certifications", Content: EducationContent },
};

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function SectionModal() {
  const activeSection = useUIStore((s) => s.activeSection);
  const closeSection  = useUIStore((s) => s.closeSection);

  const section = activeSection ? SECTION_MAP[activeSection] : null;
  const dialogRef = useDialog(!!section, closeSection);

  return (
    <AnimatePresence>
      {section && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-void/40"
            onClick={closeSection}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="section-title"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="glass-panel scroll-thin relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-glowCyan"
          >
            <button
              onClick={closeSection}
              className="absolute right-4 top-4 rounded-full border border-white/10 px-2 py-1 font-mono text-[11px] text-mist hover:text-white"
              aria-label="Close section"
            >
              esc
            </button>
            <p className="font-mono text-[10px] uppercase tracking-widest text-synapse/80">
              Node
            </p>
            <h2 id="section-title" className="font-display text-glow-cyan mb-4 text-xl font-semibold text-white">
              {section.title}
            </h2>
            <section.Content />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
