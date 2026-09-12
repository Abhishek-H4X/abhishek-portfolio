import { useEffect, useRef } from "react";
import { useUIStore } from "../store";

export default function CustomCursor() {
  const dotRef = useRef();
  const ringRef = useRef();
  const posRef = useRef({ x: 0, y: 0 });
  const ringPosRef = useRef({ x: 0, y: 0 });
  const cursorVariant = useUIStore((s) => s.cursorVariant);

  useEffect(() => {
    // Skip entirely on touch devices — the fallback cursor is auto (see CSS).
    const media = window.matchMedia("(min-width: 769px) and (pointer: fine)");
    const hide = () => document.body.classList.remove("has-custom-cursor");
    media.addEventListener("change", hide);
    window.addEventListener("blur", hide);
    document.addEventListener("mouseleave", hide);

    const handleMove = (e) => {
      if (!media.matches) return;
      document.body.classList.add("has-custom-cursor");
      posRef.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };
    window.addEventListener("mousemove", handleMove);

    let raf;
    const animateRing = () => {
      ringPosRef.current.x += (posRef.current.x - ringPosRef.current.x) * 0.18;
      ringPosRef.current.y += (posRef.current.y - ringPosRef.current.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPosRef.current.x}px, ${ringPosRef.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(animateRing);
    };
    raf = requestAnimationFrame(animateRing);

    return () => {
      hide();
      media.removeEventListener("change", hide);
      window.removeEventListener("blur", hide);
      document.removeEventListener("mouseleave", hide);
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden="true" className="custom-cursor pointer-events-none fixed inset-0 z-[100]">
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-synapse"
        style={{ boxShadow: "0 0 8px 2px rgba(0,210,255,0.9)" }}
      />
      <div
        ref={ringRef}
        className={`fixed left-0 top-0 rounded-full border transition-all duration-200 ease-out ${
          cursorVariant === "hover"
            ? "h-10 w-10 border-pulse/80"
            : "h-6 w-6 border-synapse/50"
        }`}
        style={{
          boxShadow:
            cursorVariant === "hover"
              ? "0 0 20px rgba(0,255,135,0.35)"
              : "0 0 12px rgba(0,210,255,0.2)",
        }}
      />
    </div>
  );
}
