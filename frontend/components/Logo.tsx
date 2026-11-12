import React from 'react';

/**
 * Coral Bean mark: a branching coral inside a ship's-porthole ring,
 * sitting on a line of swell. Ink parts follow the current text colour,
 * the coral follows the theme accent, so it works in light and dark.
 */
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  const detailed = size >= 28;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      role="img"
      aria-label="Coral Bean"
    >
      <circle cx="20" cy="20" r="18.2" stroke="currentColor" strokeWidth={detailed ? 1.6 : 2} />
      {detailed && (
        <circle
          cx="20"
          cy="20"
          r="15"
          stroke="currentColor"
          strokeOpacity={0.5}
          strokeWidth={0.7}
          strokeDasharray=".7 2.42"
          strokeLinecap="round"
        />
      )}
      <g className="text-coral" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path strokeWidth={2.4} d="M20 28.6c0-3-.4-5-1.6-7.2" />
        <path strokeWidth={2} d="M18.4 21.4c-.6-2.6.2-5-.6-8.4" />
        <path strokeWidth={2} d="M19.4 24.6c-2.6-.6-5.2-2-6-5.2" />
        <path strokeWidth={1.6} d="M13.4 19.4c-.6-1.8-.4-3.4.4-5" />
        <path strokeWidth={1.6} d="M13.6 20.6c-1.6-.2-2.8-.9-3.4-2.2" />
        <path strokeWidth={2} d="M18.8 22.4c2.4-.4 4.6-1.6 5.6-4.4" />
        <path strokeWidth={1.6} d="M24.4 18c.6-1.8.4-3.4-.2-4.8" />
        <path strokeWidth={1.6} d="M24 18.6c1.8 0 3.2-.8 4-2.4" />
        {detailed && <path strokeWidth={1.4} d="M18 16.4c1-.6 1.6-1.6 1.8-2.8" />}
      </g>
      <path
        d="M9.6 30.6c1.4 0 1.4-1 2.8-1s1.4 1 2.8 1 1.4-1 2.8-1 1.4 1 2.8 1 1.4-1 2.8-1 1.4 1 2.8 1 1.4-1 2.8-1"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({ size = 34, showTagline = true }: { size?: number; showTagline?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-ink">
      <LogoMark size={size} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[19px] font-semibold tracking-tight">Coral Bean</span>
        {showTagline && (
          <span className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-3">
            Deal Intelligence
          </span>
        )}
      </span>
    </span>
  );
}
