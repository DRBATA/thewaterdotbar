import React from "react";

/**
 * Subtle animated hex-grid to evoke molecular hydration science.
 * Fixed behind all content, ultra-low opacity.
 */
export default function MoleculeBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden opacity-10 mix-blend-lighten">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="animate-[molecule-pan_60s_linear_infinite]"
      >
        <defs>
          <pattern
            id="hex"
            width="10"
            height="8.66"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(1) translate(0)"
          >
            {/* Hexagon shape */}
            <polygon
              points="5 0, 10 2.886, 10 7.5, 5 10.386, 0 7.5, 0 2.886"
              stroke="white"
              strokeWidth="0.4"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex)" />
      </svg>
    </div>
  );
}
