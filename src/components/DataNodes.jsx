import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { NODES } from "../data/resumeData";
import { useUIStore } from "../store";
import { rememberNodePosition } from "../lib/nodePositions";
import { useResumeData } from "../hooks/useResumeData";
import { useReducedMotion } from "framer-motion";

// Mini component to render a unique tech icon inside each node
function NodeIcon({ id, color }) {
  if (id === "profile") {
    return (
      <div className="flex flex-col items-center justify-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          <path d="M2 12h20"></path>
        </svg>
      </div>
    );
  }
  if (id === "experience") {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
      </svg>
    );
  }
  if (id === "projects") {
    return (
      <div className="relative flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      </div>
    );
  }
  if (id === "skills") {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
      </svg>
    );
  }
  if (id === "education") {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    );
  }
  return null;
}

// Central "Sun" node — the candidate's profile
function SunNode({ node }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const activeSection = useUIStore((s) => s.activeSection);
  const openSection = useUIStore((s) => s.openSection);
  const setHoveredNode = useUIStore((s) => s.setHoveredNode);
  const setCursorVariant = useUIStore((s) => s.setCursorVariant);
  const setFocusTarget = useUIStore((s) => s.setFocusTarget);

  const { size } = useThree();
  const scaleFactor = Math.min(1, size.width / 600);

  const isActive = activeSection === node.id;
  const anyActive = !!activeSection;

  const handleClick = (e) => {
    e.stopPropagation();
    openSection(node.id);
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Html distanceFactor={8} center zIndexRange={[100, 0]}>
        <div className="relative flex flex-col items-center justify-center">
          {/* Main Glassmorphic Circular Node */}
          <button
            type="button"
            aria-label={"Explore " + node.label}
            aria-haspopup="dialog"
            onClick={handleClick}
            onMouseEnter={() => {
              setHovered(true);
              setHoveredNode(node.id);
              setCursorVariant("hover");
            }}
            onMouseLeave={() => {
              setHovered(false);
              setHoveredNode(null);
              setCursorVariant("default");
            }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-full backdrop-blur-md transition-all duration-300"
            style={{
              width: `${160 * scaleFactor}px`,
              height: `${160 * scaleFactor}px`,
              background: "rgba(4, 6, 11, 0.4)",
              border: `2px solid ${node.color}`,
              boxShadow: hovered || isActive 
                ? `0 0 30px ${node.color}, inset 0 0 20px ${node.color}` 
                : `0 0 15px ${node.color}, inset 0 0 8px ${node.color}`,
              transform: hovered || isActive ? "scale(1.1)" : "scale(1)",
              zIndex: isActive ? 50 : 10,
            }}
          >
            {/* Inner rotating radar/dashed border */}
            <div 
              className="absolute inset-3 rounded-full border border-dashed border-white/30"
              style={{ animation: "spin 12s linear infinite" }}
            />
            <div 
              className="absolute inset-5 rounded-full border border-dotted border-white/10"
              style={{ animation: "spin 20s linear infinite reverse" }}
            />
            
            <div className="relative z-10 flex flex-col items-center gap-1">
              <NodeIcon id={node.id} color={node.color} />
              
              <div
                className="mt-1 whitespace-nowrap text-center font-display text-[14px] font-semibold tracking-wide"
                style={{
                  color: node.color,
                  textShadow: `0 0 12px ${node.color}99`,
                }}
              >
                {node.label}
              </div>
              <div
                className="font-mono text-[9px]"
                style={{ color: "rgba(143, 163, 192, 0.8)" }}
              >
                Central Profile
              </div>
            </div>
          </button>
        </div>
      </Html>
    </group>
  );
}

// Orbiting "Planet" node
function PlanetNode({ node }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const activeSection = useUIStore((s) => s.activeSection);
  const openSection = useUIStore((s) => s.openSection);
  const setHoveredNode = useUIStore((s) => s.setHoveredNode);
  const setCursorVariant = useUIStore((s) => s.setCursorVariant);

  const { size } = useThree();
  const scaleFactor = Math.min(1, size.width / 600);

  const isActive = activeSection === node.id;
  const angleRef = useRef(node.orbitOffset || 0);
  const worldPosition = useRef(new THREE.Vector3());
  const reducedMotion = useReducedMotion();

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (!activeSection && !reducedMotion) angleRef.current += delta * node.orbitSpeed;
    const angle = angleRef.current;
    const radius = node.orbitRadius * scaleFactor;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    groupRef.current.position.set(x, 0, z);
    groupRef.current.updateWorldMatrix(true, false);
    groupRef.current.getWorldPosition(worldPosition.current);
    rememberNodePosition(node.id, worldPosition.current);
  }, -1);

  const handleClick = (e) => {
    e.stopPropagation();
    openSection(node.id);
  };

  return (
    <group ref={groupRef}>
      <Html distanceFactor={10} center zIndexRange={[100, 0]}>
        <div className="relative flex flex-col items-center justify-center">
          {/* Main Glassmorphic Circular Node */}
          <button
            type="button"
            aria-label={"Explore " + node.label}
            aria-haspopup="dialog"
            onClick={handleClick}
            onMouseEnter={() => {
              setHovered(true);
              setHoveredNode(node.id);
              setCursorVariant("hover");
            }}
            onMouseLeave={() => {
              setHovered(false);
              setHoveredNode(null);
              setCursorVariant("default");
            }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-full backdrop-blur-md transition-all duration-300"
            style={{
              width: `${110 * scaleFactor}px`,
              height: `${110 * scaleFactor}px`,
              background: "rgba(4, 6, 11, 0.4)",
              border: `2px solid ${node.color}`,
              boxShadow: hovered || isActive 
                ? `0 0 25px ${node.color}, inset 0 0 15px ${node.color}` 
                : `0 0 10px ${node.color}, inset 0 0 5px ${node.color}`,
              transform: hovered || isActive ? "scale(1.15)" : "scale(1)",
              zIndex: isActive ? 50 : 10,
            }}
          >
            {/* Inner rotating radar/dashed border */}
            <div 
              className="absolute inset-2 rounded-full border border-dashed border-white/20"
              style={{ animation: "spin 15s linear infinite" }}
            />
            
            <div className="relative z-10 flex flex-col items-center gap-1">
              <NodeIcon id={node.id} color={node.color} />
              
              <div
                className="max-w-[90px] text-center font-display text-[10px] font-semibold leading-tight tracking-wide"
                style={{
                  color: node.color,
                  textShadow: `0 0 10px ${node.color}99`,
                }}
              >
                {node.label}
              </div>
            </div>
          </button>
        </div>
      </Html>
    </group>
  );
}

export default function DataNodes() {
  const { PROFILE } = useResumeData();
  const sunNode = { ...NODES.find((n) => n.isSun), label: PROFILE.name };
  const planetNodes = NODES.filter((n) => !n.isSun);

  return (
    <group rotation={[0.15, 0, 0]}>
      {sunNode && <SunNode node={sunNode} />}
      {planetNodes.map((node) => (
        <PlanetNode key={node.id} node={node} />
      ))}
    </group>
  );
}
