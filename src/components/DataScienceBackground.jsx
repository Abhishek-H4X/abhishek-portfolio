// Multi-layered futuristic Data Science background.
// Renders behind the 3D canvas as a pure HTML/CSS overlay.
// Layer 1: Animated matrix grid
// Layer 2: Floating data visualization SVGs
// Layer 3: Tech tool badges and hex streams

export default function DataScienceBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* === LAYER 1: Matrix Grid Overlay === */}
      <div className="bg-matrix-grid absolute inset-0" />

      {/* Grid intersection glow dots */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`dot-${i}`}
          className="absolute h-1 w-1 rounded-full"
          style={{
            left: `${10 + (i % 4) * 25}%`,
            top: `${15 + Math.floor(i / 4) * 30}%`,
            background: "rgba(0, 210, 255, 0.15)",
            boxShadow: "0 0 8px rgba(0, 210, 255, 0.2)",
            animation: `data-pulse ${6 + (i % 3) * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}

      {/* === LAYER 2: Floating Data Visualization Elements === */}

      {/* Mini line chart */}
      <svg
        className="bg-data-viz"
        width="120"
        height="60"
        viewBox="0 0 120 60"
        style={{ left: "8%", top: "20%", animationDelay: "0s" }}
      >
        <polyline
          points="0,50 20,35 40,42 60,18 80,28 100,10 120,22"
          fill="none"
          stroke="#00D2FF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <polyline
          points="0,55 20,48 40,50 60,38 80,42 100,30 120,35"
          fill="none"
          stroke="#00FF87"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>

      {/* Scatter plot */}
      <svg
        className="bg-data-viz"
        width="100"
        height="100"
        viewBox="0 0 100 100"
        style={{
          right: "12%",
          top: "15%",
          animationDelay: "3s",
          animation: "float-drift-reverse 30s ease-in-out infinite, data-pulse 10s ease-in-out infinite",
        }}
      >
        {[
          [20, 70], [35, 50], [45, 60], [55, 30], [65, 45],
          [72, 25], [30, 40], [80, 35], [15, 55], [60, 20],
          [85, 15], [50, 50], [40, 75],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={2} fill="#7C5CFF" opacity={0.8} />
        ))}
        {/* Trend line */}
        <line x1="10" y1="75" x2="90" y2="15" stroke="#7C5CFF" strokeWidth="0.5" opacity="0.4" strokeDasharray="4 3" />
      </svg>

      {/* Neural network mini diagram */}
      <svg
        className="bg-data-viz"
        width="140"
        height="100"
        viewBox="0 0 140 100"
        style={{
          left: "15%",
          bottom: "18%",
          animationDelay: "5s",
          animation: "float-drift-slow 28s ease-in-out infinite, data-pulse 14s ease-in-out infinite",
        }}
      >
        {/* Input layer */}
        {[25, 50, 75].map((y, i) => (
          <g key={`in-${i}`}>
            <circle cx="15" cy={y} r="4" fill="none" stroke="#00D2FF" strokeWidth="1" />
            {/* Connections to hidden */}
            {[20, 40, 60, 80].map((hy, j) => (
              <line key={j} x1="19" y1={y} x2="56" y2={hy} stroke="#00D2FF" strokeWidth="0.3" opacity="0.5" />
            ))}
          </g>
        ))}
        {/* Hidden layer */}
        {[20, 40, 60, 80].map((y, i) => (
          <g key={`hid-${i}`}>
            <circle cx="60" cy={y} r="3.5" fill="none" stroke="#00FF87" strokeWidth="1" />
            {[30, 50, 70].map((oy, j) => (
              <line key={j} x1="64" y1={y} x2="101" y2={oy} stroke="#00FF87" strokeWidth="0.3" opacity="0.4" />
            ))}
          </g>
        ))}
        {/* Output layer */}
        {[30, 50, 70].map((y, i) => (
          <circle key={`out-${i}`} cx="105" cy={y} r="4" fill="none" stroke="#FFC857" strokeWidth="1" />
        ))}
      </svg>

      {/* Heatmap grid */}
      <svg
        className="bg-data-viz"
        width="80"
        height="80"
        viewBox="0 0 80 80"
        style={{
          right: "8%",
          bottom: "25%",
          animationDelay: "7s",
          animation: "float-drift-reverse 32s ease-in-out infinite, data-pulse 11s ease-in-out infinite",
        }}
      >
        {[0, 1, 2, 3, 4].map((row) =>
          [0, 1, 2, 3, 4].map((col) => {
            const intensity = Math.sin(row * 1.5 + col * 0.8) * 0.5 + 0.5;
            return (
              <rect
                key={`${row}-${col}`}
                x={col * 16}
                y={row * 16}
                width="14"
                height="14"
                rx="2"
                fill={`rgba(255, 92, 122, ${intensity * 0.7})`}
              />
            );
          })
        )}
      </svg>

      {/* Bar chart */}
      <svg
        className="bg-data-viz"
        width="100"
        height="60"
        viewBox="0 0 100 60"
        style={{
          left: "55%",
          top: "70%",
          animationDelay: "2s",
          animation: "float-drift-slow 26s ease-in-out infinite, data-pulse 9s ease-in-out infinite",
        }}
      >
        {[35, 50, 25, 45, 55, 30, 48].map((h, i) => (
          <rect
            key={i}
            x={i * 14}
            y={60 - h}
            width="10"
            height={h}
            rx="2"
            fill="#00D2FF"
            opacity={0.5 + (i % 3) * 0.15}
          />
        ))}
      </svg>

      {/* === LAYER 3: Tech Tool Badges & Hex Streams === */}

      {/* Floating tech badges */}
      {[
        { text: "Python", left: "5%", top: "35%", delay: "0s", duration: "22s" },
        { text: "SQL", left: "82%", top: "42%", delay: "3s", duration: "26s" },
        { text: "PyTorch", left: "70%", top: "72%", delay: "6s", duration: "24s" },
        { text: "pandas", left: "18%", top: "75%", delay: "2s", duration: "28s" },
        { text: "Scikit-learn", left: "88%", top: "12%", delay: "8s", duration: "20s" },
        { text: "Git", left: "45%", top: "8%", delay: "4s", duration: "30s" },
        { text: "TensorFlow", left: "30%", top: "88%", delay: "5s", duration: "25s" },
        { text: "NumPy", left: "92%", top: "58%", delay: "1s", duration: "27s" },
      ].map(({ text, left, top, delay, duration }) => (
        <div
          key={text}
          className="bg-tech-badge"
          style={{
            left,
            top,
            animationDelay: delay,
            animationDuration: duration,
          }}
        >
          {text}
        </div>
      ))}

      {/* Hex/binary streams */}
      {[
        { left: "3%", top: "10%", delay: "0s" },
        { left: "96%", top: "5%", delay: "8s" },
        { left: "48%", top: "0%", delay: "15s" },
      ].map(({ left, top, delay }, i) => (
        <div
          key={`hex-${i}`}
          className="bg-hex-stream"
          style={{
            left,
            top,
            animationDelay: delay,
            animationDuration: `${35 + i * 5}s`,
          }}
        >
          {Array.from({ length: 30 }, (_, j) => (
            <div key={j}>
              {Math.random().toString(16).slice(2, 6).toUpperCase()}
            </div>
          ))}
        </div>
      ))}

      {/* Abstract pipeline connectors */}
      <svg
        className="bg-data-viz"
        width="200"
        height="40"
        viewBox="0 0 200 40"
        style={{
          left: "30%",
          top: "50%",
          animationDelay: "4s",
          opacity: 0.04,
        }}
      >
        <path
          d="M0,20 Q30,5 60,20 T120,20 T180,20 L200,20"
          fill="none"
          stroke="#00D2FF"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        <circle cx="60" cy="20" r="3" fill="#00FF87" opacity="0.6" />
        <circle cx="120" cy="20" r="3" fill="#7C5CFF" opacity="0.6" />
        <circle cx="180" cy="20" r="3" fill="#FFC857" opacity="0.6" />
      </svg>
    </div>
  );
}
