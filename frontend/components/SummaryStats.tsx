import React, { useState, useEffect } from 'react';

interface SummaryStatsProps {
  summary: {
    total_deals: number;
    red_count: number;
    amber_count: number;
    green_count: number;
  } | null;
}

const CountUp = ({ end, duration = 700 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frame = 0;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const pct = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setCount(Math.round(end * eased));
      if (pct < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [end, duration]);

  return <>{count}</>;
};

export default function SummaryStats({ summary }: SummaryStatsProps) {
  if (!summary) return null;

  const total = Math.max(summary.total_deals, 1);
  const tiles = [
    { label: 'At risk', value: summary.red_count, text: 'text-risk-red', bar: 'bg-risk-red' },
    { label: 'Watch', value: summary.amber_count, text: 'text-risk-amber', bar: 'bg-risk-amber' },
    { label: 'On course', value: summary.green_count, text: 'text-risk-green', bar: 'bg-risk-green' },
  ];

  return (
    <div className="mb-8 rounded-lg border border-line bg-surface">
      <div className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
        <div className="border-b border-line p-4 sm:border-b-0">
          <div className="eyebrow">Deals</div>
          <div className="mt-1 font-display text-3xl font-medium tabular-nums text-ink">
            <CountUp end={summary.total_deals} />
          </div>
        </div>
        {tiles.map((t, i) => (
          <div key={t.label} className={`p-4 ${i === 0 ? 'border-b border-line sm:border-b-0' : ''}`}>
            <div className="eyebrow flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${t.bar}`} />
              {t.label}
            </div>
            <div className={`mt-1 font-display text-3xl font-medium tabular-nums ${t.text}`}>
              <CountUp end={t.value} />
            </div>
          </div>
        ))}
      </div>
      {/* Proportion bar */}
      <div className="flex h-1.5 overflow-hidden rounded-b-lg bg-sunken" aria-hidden>
        {tiles.map((t) => (
          <div key={t.label} className={t.bar} style={{ width: `${(t.value / total) * 100}%` }} />
        ))}
      </div>
    </div>
  );
}
