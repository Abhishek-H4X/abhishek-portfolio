import { useMemo } from "react";
import * as THREE from "three";
import { NODES } from "../data/resumeData";

import { useThree } from "@react-three/fiber";

const orbitNodes = NODES.filter((n) => !n.isSun && n.orbitRadius > 0);

// Thin concentric orbital rings for the solar system layout.
// Each ring corresponds to a planet node's orbit path.
export default function OrbitalRings() {
  const { size } = useThree();
  const scaleFactor = Math.min(1, size.width / 600);

  const rings = useMemo(
    () =>
      orbitNodes.map((node) => {
        const segments = 128;
        const points = [];
        const radius = node.orbitRadius * scaleFactor;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          points.push(
            new THREE.Vector3(
              Math.cos(angle) * radius,
              0,
              Math.sin(angle) * radius
            )
          );
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return { geometry, color: node.color, radius: radius };
      }),
    [scaleFactor]
  );

  return (
    <group rotation={[0.15, 0, 0]}>
      {rings.map((ring, i) => (
        <line key={i} geometry={ring.geometry}>
          <lineBasicMaterial
            color={ring.color}
            transparent
            opacity={0.18}
            linewidth={1}
          />
        </line>
      ))}
    </group>
  );
}
