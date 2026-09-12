/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#04060B",
        abyss: "#070B14",
        panel: "#0B1220",
        synapse: "#00D2FF",
        pulse: "#00FF87",
        signal: "#7C5CFF",
        ember: "#FF5C7A",
        mist: "#8FA3C0",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        glowCyan: "0 0 24px rgba(0, 210, 255, 0.45)",
        glowGreen: "0 0 24px rgba(0, 255, 135, 0.4)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: 0.55 },
          "50%": { opacity: 1 },
        },
        drift: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
          "100%": { transform: "translateY(0px)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
        drift: "drift 4.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
