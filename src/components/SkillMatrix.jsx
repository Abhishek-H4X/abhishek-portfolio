import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { SKILLS, NODES } from "../data/resumeData";

const origin = NODES.find((n) => n.id === "skills").position;

const GROUP_COLORS = {
  "Data Science": "#FF5C7A",
  Visualization: "#FFC857",
  Web: "#00D2FF",
  Networking: "#00FF87",
};

// Arrange skills in a loose 3D grid cluster around the Skills node,
// each word rendered as an HTML chip that subtly rotates with the group.
function buildLayout() {
  const cols = 4;
  const spacingX = 1.15;
  const spacingY = 0.62;
  const spacingZ = 0.9;
  return SKILLS.map((skill, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      ...skill,
      position: [
        origin[0] + (col - (cols - 1) / 2) * spacingX,
        origin[1] + 1.6 - row * spacingY,
        origin[2] + Math.sin(i * 1.3) * spacingZ,
      ],
    };
  });
}

export default function SkillMatrix() {
  const groupRef = useRef();
  const layout = useRef(buildLayout()).current;

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.18;
  });

  return (
    <group ref={groupRef}>
      {layout.map((skill, i) => (
        <group key={skill.name} position={skill.position}>
          <Html distanceFactor={9} center occlude>
            <div
              className="select-none whitespace-nowrap rounded-md border px-2.5 py-1 font-mono text-[11px] backdrop-blur-sm animate-drift"
              style={{
                borderColor: `${GROUP_COLORS[skill.group]}55`,
                background: "rgba(4, 6, 11, 0.55)",
                color: GROUP_COLORS[skill.group],
                animationDelay: `${i * 0.15}s`,
                pointerEvents: "none",
              }}
            >
              {skill.name}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}
