import React from 'react';
import { Platform } from 'react-native';

/**
 * IndependentBadge — A professional badge styled like App Store / Google Play badges
 * but communicating that Wanderkind is an independent, direct-install PWA.
 *
 * Rendered as inline SVG on web (matching the classic badge dimensions ~135x40).
 * Returns null on native since it's only relevant for the web landing page.
 */

type Props = {
  line1?: string;
  line2?: string;
  width?: number;
};

export function IndependentBadge({
  line1 = 'SECURE',
  line2 = 'Direct Install',
  width,
}: Props) {
  if (Platform.OS !== 'web') return null;

  // Auto-size: estimate width from line2 length (~8px per char at 14.5px font)
  const autoWidth = Math.max(170, 40 + Math.ceil(line2.length * 8.2));
  const w = width ?? autoWidth;
  const height = 46;
  const r = 7; // corner radius — same as App Store badge

  return (
    <div
      style={{
        display: 'inline-block',
        width: w,
        height,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      aria-label={`${line1} — ${line2}`}
      role="img"
    >
      <svg
        viewBox={`0 0 ${w} ${height}`}
        width={w}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        {/* Badge background — creamy white with amber border */}
        <rect
          x="0.5"
          y="0.5"
          width={w - 1}
          height={height - 1}
          rx={r}
          ry={r}
          fill="#FAFAF5"
          stroke="#C8762A"
          strokeWidth="1"
        />

        {/* Shield icon — evokes trust / independence */}
        <g transform="translate(12, 9)" fill="none">
          {/* Shield outline */}
          <path
            d="M10 0 L19 4 L19 13 C19 20 10 27 10 27 C10 27 1 20 1 13 L1 4 Z"
            fill="none"
            stroke="#C8762A"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* Inner shield fill */}
          <path
            d="M10 2.5 L17.2 5.8 L17.2 13 C17.2 18.5 10 24 10 24 C10 24 2.8 18.5 2.8 13 L2.8 5.8 Z"
            fill="rgba(200,118,42,0.15)"
          />
          {/* Checkmark inside shield */}
          <polyline
            points="6,13.5 9,16.5 14.5,10.5"
            stroke="#C8762A"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* Top line — small caps label, centered in text area */}
        <text
          x={w / 2 + 10}
          y="18"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
          fontSize="9"
          fontWeight="600"
          letterSpacing="1.5"
          fill="#6B5A3E"
        >
          {line1}
        </text>

        {/* Bottom line — larger, orange, centered in text area */}
        <text
          x={w / 2 + 10}
          y="34"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
          fontSize="14.5"
          fontWeight="700"
          letterSpacing="-0.2"
          fill="#C8762A"
        >
          {line2}
        </text>
      </svg>
    </div>
  );
}
