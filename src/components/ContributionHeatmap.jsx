import React from "react";

// Matches the theme colors
const COLORS = {
  0: "bg-white/5", // 0 contributions
  1: "bg-pulse/30",
  2: "bg-pulse/60",
  3: "bg-synapse/80",
  4: "bg-synapse",
};

export default function ContributionHeatmap({ calendar }) {
  if (!calendar || !calendar.weeks) return null;

  return (
    <div className="mb-6 rounded-xl border border-white/5 bg-void/30 p-4 shadow-inner">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-mist/60">
          Contributions
        </p>
        <p className="font-mono text-[10px] text-white/70">
          {calendar.totalContributions} in the last year
        </p>
      </div>

      {/* 
        Scroll container for heatmap. 
        GitHub displays 53 weeks across, 7 days down.
      */}
      <div className="flex w-full overflow-x-auto pb-2 scroll-thin">
        <div className="flex gap-1" style={{ minWidth: "max-content" }}>
          {calendar.weeks.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-1">
              {week.contributionDays.map((day, dIndex) => {
                // Map contribution count to color intensity
                let intensity = 0;
                if (day.contributionCount > 0) intensity = 1;
                if (day.contributionCount > 3) intensity = 2;
                if (day.contributionCount > 6) intensity = 3;
                if (day.contributionCount > 10) intensity = 4;

                const colorClass = COLORS[intensity];

                return (
                  <div
                    key={dIndex}
                    className={`h-2.5 w-2.5 rounded-[2px] ${colorClass} transition-colors hover:ring-1 hover:ring-white/50`}
                    title={`${day.contributionCount} contributions on ${day.date}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-end gap-1.5 font-mono text-[9px] text-mist/50">
        <span>Less</span>
        <div className={`h-2 w-2 rounded-[2px] ${COLORS[0]}`} />
        <div className={`h-2 w-2 rounded-[2px] ${COLORS[1]}`} />
        <div className={`h-2 w-2 rounded-[2px] ${COLORS[2]}`} />
        <div className={`h-2 w-2 rounded-[2px] ${COLORS[3]}`} />
        <div className={`h-2 w-2 rounded-[2px] ${COLORS[4]}`} />
        <span>More</span>
      </div>
    </div>
  );
}
