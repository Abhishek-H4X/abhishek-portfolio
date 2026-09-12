import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useUIStore } from "../store";

const CURVE_POINTS = [
  [-4.5, -3.4, 0],
  [-2, -3.9, 1.5],
  [0, -3.6, -1.2],
  [2, -4.1, 1.2],
  [4.5, -3.4, 0],
];

export default function DataPipeline() {
  const pipelineRunning = useUIStore((s) => s.pipelineRunning);
  const groupRef = useRef();
  const particleRefs = useRef([]);
  const progressRef = useRef([]);

  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        CURVE_POINTS.map((p) => new THREE.Vector3(...p))
      ),
    []
  );

  const tubeGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, 64, 0.06, 8, false),
    [curve]
  );

  const particleCount = 14;
  if (progressRef.current.length === 0) {
    for (let i = 0; i < particleCount; i++) {
      progressRef.current.push(-i * 0.08);
    }
  }

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const targetOpacity = pipelineRunning ? 0.9 : 0.28;
    groupRef.current.traverse((child) => {
      if (child.isMesh && child.userData.isTube) {
        child.material.opacity = THREE.MathUtils.lerp(
          child.material.opacity,
          targetOpacity,
          0.08
        );
      }
    });

    particleRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      if (pipelineRunning) {
        progressRef.current[i] += delta * 0.35;
      } else {
        progressRef.current[i] += delta * 0.02;
      }
      let t = progressRef.current[i] % 1;
      if (t < 0) t += 1;
      const point = curve.getPointAt(t);
      mesh.position.copy(point);
      mesh.material.opacity = pipelineRunning ? 1 : 0.35;
      mesh.scale.setScalar(pipelineRunning ? 1.4 : 0.8);
    });
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={tubeGeometry} userData={{ isTube: true }}>
        <meshBasicMaterial
          color="#00D2FF"
          transparent
          opacity={0.28}
          wireframe
        />
      </mesh>

      {Array.from({ length: particleCount }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (particleRefs.current[i] = el)}
        >
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#00FF87" transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
}
