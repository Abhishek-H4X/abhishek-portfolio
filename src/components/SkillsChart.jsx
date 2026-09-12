// SkillsChart.jsx
// Horizontal bar chart of skills grouped by category.
// Uses recharts BarChart with a vertical layout (horizontal bars).
// Reacts to live data changes by flashing a brief glow border.

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useResumeData } from "../hooks/useResumeData";

// Node-color palette per group
const GROUP_COLORS = {
  "Data Science": "#00D2FF", // synapse
  "Visualization": "#7C5CFF", // signal
  "Web": "#00FF87",            // pulse
  "Networking": "#FF5C7A",     // ember
};

// Custom dark tooltip that matches the glass theme
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, level, group } = payload[0].payload;
  const color = GROUP_COLORS[group] ?? "#8FA3C0";
  return (
    <div
      className="rounded-lg border border-white/10 px-3 py-1.5 font-mono text-[11px] shadow-lg"
      style={{ background: "rgba(9,16,30,0.92)", backdropFilter: "blur(12px)" }}
    >
      <span style={{ color }}>{name}</span>
      <span className="ml-2 text-white">{level}%</span>
    </div>
  );
}

// Legend pill row
function Legend() {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {Object.entries(GROUP_COLORS).map(([group, color]) => (
        <span key={group} className="flex items-center gap-1.5 font-mono text-[9px] text-mist/60">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          {group}
        </span>
      ))}
    </div>
  );
}

export default function SkillsChart() {
  const { SKILLS } = useResumeData();
  
  const fingerprint = JSON.stringify(SKILLS);
  const prevFp = useRef(fingerprint);
  const [flashed, setFlashed] = useState(false);

  useEffect(() => {
    if (prevFp.current !== fingerprint) {
      prevFp.current = fingerprint;
      setFlashed(true);
      const t = setTimeout(() => setFlashed(false), 1800);
      return () => clearTimeout(t);
    }
  }, [fingerprint]);

  const data = SKILLS.map((s) => ({
    name: s.name,
    level: s.level ?? 70,
    group: s.group,
  }));

  const chartHeight = data.length * 32 + 8;

  return (
    <motion.div 
      className="mt-4 rounded-xl border p-2 -mx-2"
      animate={flashed
        ? { borderColor: ["rgba(0,210,255,0)", "rgba(0,210,255,0.7)", "rgba(0,210,255,0)"] }
        : { borderColor: "rgba(255,255,255,0)" }
      }
      transition={{ duration: 1.5 }}
    >
      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-mist/40 px-2">
        proficiency index
      </p>
      <div className="px-2">
        <Legend />
      </div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
          barCategoryGap="30%"
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            hide
            tick={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={148}
            tick={{
              fill: "#8FA3C0",
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="level" radius={[0, 4, 4, 0]} barSize={10} background={{ fill: "rgba(255,255,255,0.04)", radius: [0, 4, 4, 0] }}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={GROUP_COLORS[entry.group] ?? "#8FA3C0"}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
