import { useEffect, useState } from "react";

// Plain ASCII, not Unicode box-drawing (│ ─): box-drawing glyphs are drawn to
// tile seamlessly edge-to-edge for terminal borders, so they render with
// near-zero right-side bearing and visually bleed into adjacent text.
const FRAMES = ["|", "/", "-", "\\"];
const FRAME_INTERVAL_MS = 100;

export interface SpinnerProps {
  className?: string;
}

/** Terminal-style ASCII spinner, cycling frames on a plain interval (not a CSS animation). */
export function Spinner({ className = "" }: SpinnerProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrameIndex((index) => (index + 1) % FRAMES.length);
    }, FRAME_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      role="status"
      aria-label="Loading"
      style={{ width: "1ch" }}
      className={`inline-block text-center leading-none font-body tabular-nums ${className}`}
    >
      {FRAMES[frameIndex]}
    </span>
  );
}
