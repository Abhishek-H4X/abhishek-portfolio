import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { NODES } from "../data/resumeData";

const sunNode = NODES.find((n) => n.isSun);
const planetNodes = NODES.filter((n) => !n.isSun);

// Subtle dotted connection lines from the sun to each orbiting planet.
// These pulse gently to suggest energy flowing from the center.
export default function ConnectionLines() {
  const materialsRef = useRef([]);
  const groupRef = useRef();
  const { size } = useThree();
  const scaleFactor = Math.min(1, size.width / 600);

  useFrame((state) => {
    materialsRef.current.forEach((mat, i) => {
      if (!mat) return;
      mat.opacity = 0.12 + Math.sin(state.clock.elapsedTime * 1.2 + i) * 0.08;
    });

    // Update line endpoints to follow orbiting planets
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (!child.geometry || !planetNodes[i]) return;
        const node = planetNodes[i];
        const angle =
          state.clock.elapsedTime * node.orbitSpeed + (node.orbitOffset || 0);
        const radius = node.orbitRadius * scaleFactor;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        const positions = child.geometry.attributes.position;
        // End point follows planet
        positions.setXYZ(1, x, 0, z);
        positions.needsUpdate = true;
      });
    }
  });

  const lines = useMemo(
    () =>
      planetNodes.map((node) => {
        const radius = node.orbitRadius * scaleFactor;
        const points = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(radius, 0, 0),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return { geometry, color: node.color };
      }),
    [scaleFactor]
  );

  return (
    <group ref={groupRef} rotation={[0.15, 0, 0]}>
      {lines.map((line, i) => (
        <line key={i} geometry={line.geometry}>
          <lineBasicMaterial
            ref={(el) => (materialsRef.current[i] = el)}
            color={line.color}
            transparent
            opacity={0.15}
          />
        </line>
      ))}
    </group>
  );
}
