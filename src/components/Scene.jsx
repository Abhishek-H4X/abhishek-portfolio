import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import DataNodes from "./DataNodes";
import ConnectionLines from "./ConnectionLines";
import OrbitalRings from "./OrbitalRings";
import ParticleField from "./ParticleField";
import { useUIStore } from "../store";
import CameraRig from "./CameraRig";
import { useReducedMotion } from "framer-motion";

export default function Scene() {
  const controlsRef = useRef();
  const activeSection = useUIStore((s) => s.activeSection);
  const reducedMotion = useReducedMotion();

  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [2.5, 5, 12], fov: 45 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#04060B"]} />
      <fog attach="fog" args={["#04060B", 14, 30]} />

      <ambientLight intensity={0.3} />
      <pointLight position={[0, 8, 0]} intensity={0.6} color="#FFC857" />
      <pointLight position={[8, 4, 8]} intensity={0.7} color="#00D2FF" />
      <pointLight position={[-8, -3, -6]} intensity={0.5} color="#00FF87" />

      <Stars radius={50} depth={40} count={1500} factor={2} fade speed={0.3} />
      <ParticleField />
      <OrbitalRings />
      <ConnectionLines />
      <DataNodes />
      <CameraRig controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        target={[2.5, 0, 0]}
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={20}
        enabled={!activeSection}
        autoRotate={!activeSection && !reducedMotion}
        autoRotateSpeed={0.25}
        maxPolarAngle={Math.PI * 0.7}
        minPolarAngle={Math.PI * 0.15}
      />
    </Canvas>
  );
}
