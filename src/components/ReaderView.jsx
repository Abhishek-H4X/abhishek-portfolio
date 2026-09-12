// ReaderView.jsx — linear resume layout (Reader mode)
// Reads live resume data from useResumeData() hook.
// Top padding accounts for the new NavBar (h-12 = 48px → pt-20 ensures clearance).

import { useResumeData } from "../hooks/useResumeData";
import { useEffect } from "react";
import { useUIStore } from "../store";
import { useReducedMotion } from "framer-motion";

function Section({ id, title, children }) {
  return (
    <section id={"resume-" + id} tabIndex={-1} className="mb-10 scroll-mt-20">
      <h2 className="font-display mb-3 text-lg font-semibold text-synapse">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ReaderView() {
  const target = useUIStore((state) => state.readerSection);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!target) return;
    const section = document.getElementById("resume-" + target.id);
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }, [target, reducedMotion]);
  const {
    PROFILE,
    EXPERIENCE,
    PROJECTS,
    SKILLS,
    EDUCATION,
    CERTIFICATIONS,
  } = useResumeData();

  return (
    <div 
      className="scroll-thin w-full bg-void px-6 pb-24 pt-20 sm:px-10"
      style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", height: "calc(100dvh - 60px)" }}
    >
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-xs text-mist">Reader mode — linear resume</p>
        <h1 className="font-display mt-1 text-3xl font-bold text-white">
          {PROFILE.name}
        </h1>
        <p className="mt-1 text-sm text-mist">
          {PROFILE.location} · {PROFILE.tagline}
        </p>
        <div className="mt-2 flex flex-wrap gap-3 font-mono text-xs text-synapse">
          {PROFILE.email && <a href={`mailto:${PROFILE.email}`} className="hover:underline">{PROFILE.email}</a>}
          {PROFILE.github && <a href={PROFILE.github} target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>}
          {PROFILE.linkedin && <a href={PROFILE.linkedin} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a>}
        </div>

        <Section id="profile" title="Profile">
          <p className="text-[15px] leading-relaxed text-white/85">
            {PROFILE.pitch}
          </p>
          <ul className="mt-3 space-y-1.5">
            {PROFILE.highlights.map((h) => (
              <li key={h} className="flex gap-2 text-[14px] text-white/75">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-synapse" />
                {h}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="experience" title="Experience">
          <div className="space-y-5">
            {EXPERIENCE.map((job) => (
              <div key={`${job.org}-${job.dates}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-1">
                  <p className="font-medium text-white">{job.role}</p>
                  <p className="font-mono text-xs text-pulse">{job.dates}</p>
                </div>
                <p className="text-sm text-mist">{job.org}</p>
                <ul className="mt-1.5 space-y-1">
                  {job.points.map((pt) => (
                    <li key={pt} className="flex gap-2 text-[14px] text-white/75">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-pulse" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section id="projects" title="Projects">
          <div className="space-y-4">
            {PROJECTS.map((proj) => (
              <div key={proj.name}>
                <div className="flex flex-wrap items-baseline justify-between gap-1">
                  <p className="font-medium text-white">{proj.name}</p>
                  <span className="font-mono text-xs text-signal">
                    {proj.status}
                  </span>
                </div>
                <p className="text-[14px] text-white/75">{proj.description}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="skills" title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {SKILLS.map((s) => (
              <span
                key={s.name}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[13px] text-white/80"
              >
                {s.name}
              </span>
            ))}
          </div>
        </Section>

        <Section id="education" title="Education &amp; Certifications">
          {EDUCATION.map((ed) => (
            <div key={ed.school} className="mb-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-1">
                <p className="font-medium text-white">{ed.program}</p>
                <p className="font-mono text-xs text-pulse">{ed.dates}</p>
              </div>
              <p className="text-sm text-mist">{ed.school}</p>
            </div>
          ))}
          <ul className="mt-3 space-y-1">
            {CERTIFICATIONS.map((cert) => (
              <li key={cert} className="flex gap-2 text-[14px] text-white/75">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-signal" />
                {cert}
              </li>
            ))}
          </ul>
        </Section>

        <a
          href={PROFILE.resumeFile}
          download
          className="inline-flex items-center rounded-lg border border-pulse/40 bg-pulse/10 px-4 py-2 font-mono text-xs text-pulse hover:bg-pulse/20"
        >
          Download PDF Resume
        </a>
      </div>
    </div>
  );
}
