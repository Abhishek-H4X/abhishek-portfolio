// GitHubActivity.jsx
// Fetches GitHub Contribution Heatmap and Repositories via GraphQL proxy.

import { useEffect, useState } from "react";
import ContributionHeatmap from "./ContributionHeatmap";
import { useResumeData } from "../hooks/useResumeData";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Formats repo names like "agentic-hr-system" to "Agentic Hr System"
function formatRepoName(name) {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function GitHubActivity({ username }) {
  const { PROJECTS } = useResumeData();
  const ghUsername =
    username ||
    import.meta.env.VITE_GITHUB_USERNAME ||
    "Abhishek-H4X";

  const [state, setState] = useState({
    heatmap: null,
    repos: [],
    loading: true,
    error: null,
    notFound: false,
    notConfigured: false,
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/github-activity?username=${encodeURIComponent(ghUsername)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setState({
            heatmap: data.heatmap ?? null,
            repos: data.repos ?? [],
            loading: false,
            error: data.error ?? null,
            notFound: data.notFound ?? false,
            notConfigured: data.notConfigured ?? false,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            heatmap: null,
            repos: [],
            loading: false,
            error: err.message,
            notFound: false,
            notConfigured: false,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ghUsername]);

  if (state.loading) {
    return (
      <div className="mt-3 font-mono text-[11px] text-mist/50 animate-pulseGlow">
        Fetching GitHub activity…
      </div>
    );
  }

  const noActivity = state.notFound || state.notConfigured || state.error || (!state.heatmap && state.repos.length === 0);

  return (
    <div className="mt-4 flex flex-col">
      {/* Title */}
      <p className="mb-4 font-mono text-[9px] uppercase tracking-widest text-mist/40">
        GitHub Integration · @{ghUsername}
      </p>

      {noActivity ? (
        <a 
          href={`https://github.com/${ghUsername}`} 
          target="_blank" 
          rel="noreferrer"
          className="group block rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:border-white/20 hover:bg-white/10 text-center shadow-lg"
        >
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 group-hover:bg-synapse/20 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-mist group-hover:text-synapse" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="font-display text-sm font-medium text-white group-hover:text-glow-cyan transition-colors mb-2">
            View GitHub Profile
          </h3>
          <p className="font-mono text-[11px] text-mist/60 leading-relaxed max-w-[250px] mx-auto">
            Explore {ghUsername}'s repositories and open-source activity directly on GitHub.
          </p>
        </a>
      ) : null}

      {!noActivity && (
        <>
          {/* Heatmap Section */}
          {state.heatmap && <ContributionHeatmap calendar={state.heatmap} />}

          {/* Repo Cards Section */}
          <div className="space-y-3 mb-6">
            <p className="font-mono text-[9px] uppercase tracking-widest text-mist/40">Open Source</p>
            {state.repos.map((repo) => (
              <a
                key={repo.id}
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="group block rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:border-white/10 hover:bg-white/10"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-sm font-medium text-white group-hover:text-glow-cyan transition-colors">
                    {formatRepoName(repo.name)}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                      repo.status === "Completed"
                        ? "bg-signal/10 text-signal border border-signal/20"
                        : "bg-pulse/10 text-pulse border border-pulse/20"
                    }`}
                  >
                    {repo.status}
                  </span>
                </div>

                {repo.description && (
                  <p className="mt-2 text-[12px] leading-relaxed text-mist/80 line-clamp-2">
                    {repo.description}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-4">
                  {/* Language */}
                  {repo.language && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: repo.language.color || "#8b949e" }}
                      />
                      <span className="font-mono text-[10px] text-mist/60">
                        {repo.language.name}
                      </span>
                    </div>
                  )}

                  {/* Stars */}
                  {repo.stars > 0 && (
                    <div className="flex items-center gap-1">
                      <svg
                        className="h-3 w-3 text-mist/50"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z" />
                      </svg>
                      <span className="font-mono text-[10px] text-mist/60">
                        {repo.stars}
                      </span>
                    </div>
                  )}

                  {/* Latest Commit */}
                  {repo.latestCommit && (
                    <div className="ml-auto flex items-center gap-1.5 max-w-[50%]">
                      <span className="truncate font-mono text-[10px] text-mist/40">
                        {repo.latestCommit.message}
                      </span>
                      <span className="shrink-0 font-mono text-[9px] text-mist/30">
                        {timeAgo(repo.latestCommit.date)}
                      </span>
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {/* Static Resume Projects Section */}
      {PROJECTS && PROJECTS.length > 0 && (
        <div className="space-y-3 border-t border-white/5 pt-4">
          <p className="font-mono text-[9px] uppercase tracking-widest text-mist/40">Curated Showcase</p>
          {PROJECTS.map((proj, idx) => (
            <div
              key={idx}
              className="group block rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:border-white/10 hover:bg-white/10"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-sm font-medium text-white group-hover:text-glow-cyan transition-colors">
                  {proj.name}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                    proj.status === "Completed"
                      ? "bg-signal/10 text-signal border border-signal/20"
                      : "bg-pulse/10 text-pulse border border-pulse/20"
                  }`}
                >
                  {proj.status}
                </span>
              </div>

              {proj.description && (
                <p className="mt-2 text-[12px] leading-relaxed text-mist/80 line-clamp-2">
                  {proj.description}
                </p>
              )}

              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-pulse/80" />
                  <span className="font-mono text-[10px] text-mist/60">Static Project</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
