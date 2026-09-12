import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { useResumeStore } from "../hooks/useResumeData";

const ACCENT = "#00D2FF";

export default function SkillsRadar() {
  const { data } = useResumeStore();
  const { SKILLS } = data;

  // Chart Data format
  const radarData = SKILLS.map(s => ({
    subject: s.name,
    A: s.level,
    fullMark: 100
  })).slice(0, 6); // Max 6 for a clean radar

  return (
    <div className="w-full h-48 relative">
      <p className="absolute top-0 left-0 font-mono text-[9px] text-mist/40 uppercase">Skills Matrix</p>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9, fontFamily: 'monospace' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar 
            name="Skills" 
            dataKey="A" 
            stroke={ACCENT} 
            fill={ACCENT} 
            fillOpacity={0.3} 
            isAnimationActive={true}
            animationDuration={800}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
