import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { useUIStore } from "../store";

export default function CameraRig({ controlsRef }) {
  const { camera } = useThree();
  const focusTarget = useUIStore((state) => state.focusTarget);
  const activeSection = useUIStore((state) => state.activeSection);
  const reducedMotion = useReducedMotion();
  const previousView = useRef(null);
  const transition = useRef(null);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (activeSection) {
      if (!previousView.current) previousView.current = {
        position: camera.position.clone(), target: controls.target.clone(),
      };
      const target = new THREE.Vector3(...focusTarget);
      transition.current = { target, position: target.clone().add(new THREE.Vector3(0, 2.5, 5)) };
    } else if (previousView.current) {
      transition.current = previousView.current;
      previousView.current = null;
    }
  }, [activeSection, focusTarget, camera, controlsRef]);

  useFrame((_, delta) => {
    const destination = transition.current;
    const controls = controlsRef.current;
    if (!destination || !controls) return; // Leave normal dragging and zooming alone.
    controls.autoRotate = false;
    const amount = reducedMotion ? 1 : 1 - Math.exp(-6 * delta);
    camera.position.lerp(destination.position, amount);
    controls.target.lerp(destination.target, amount);
    controls.update();
    if (camera.position.distanceTo(destination.position) < 0.02 && controls.target.distanceTo(destination.target) < 0.02) {
      transition.current = null;
      controls.autoRotate = !activeSection && !reducedMotion;
    }
  });
  return null;
}
