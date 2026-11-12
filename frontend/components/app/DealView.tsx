'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Icon from '../Icon';
import { NoAnalysis } from './AppShell';
import { formatMoney, riskOf, sortDeals, useAnalysis } from '../../lib/analysis';
import { cleanReasonText, extractDeduction, parseSignalSource } from '../../lib/signals';

function ScoreRing({ score, color }: { score: number; color: string }) {
  const pct = Math.min(Math.max(score, 0), 100);
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-32 w-32 flex-shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(var(--sunken))" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-medium tabular-nums text-ink">{score}</span>
        <span className="font-mono text-[11px] text-ink-3">/ 100</span>
      </div>
    </div>
  );
}

const RING: Record<string, string> = {
  red: 'rgb(var(--risk-red))',
  amber: 'rgb(var(--risk-amber))',
  green: 'rgb(var(--risk-green))',
};

export default function DealView() {
  const id = useSearchParams()?.get('id') || '';
  const { current } = useAnalysis();
  const [done, setDone] = useState(false);

  if (!current) return <NoAnalysis what="deal details" />;

  const deals = sortDeals(current.result.dashboard.deals);
  const idx = deals.findIndex((d) => d.deal_id === id);
  const deal = deals[idx];

  if (!deal) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
        <p className="font-display text-xl text-ink">That deal isn&rsquo;t in your latest answer</p>
        <Link href="/app/deals" className="mt-4 inline-block text-sm font-medium text-coral-ink hover:underline">
          Back to pipeline
        </Link>
      </div>
    );
  }

  const r = riskOf(deal.risk_level);
  const prev = deals[idx - 1];
  const next = deals[idx + 1];
  const reasons = deal.all_reasons || [];

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex items-center justify-between text-sm">
        <Link href="/app/deals" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
          <Icon name="arrowLeft" className="h-4 w-4" /> Pipeline
        </Link>
        <span className="font-mono text-xs text-ink-3">
          {idx + 1} of {deals.length}
        </span>
      </div>

      {/* Header */}
      <section className="relative overflow-hidden rounded-lg border border-line bg-surface p-6 md:p-8">
        <span className={`absolute inset-y-0 left-0 w-1.5 ${r.bar}`} aria-hidden />
        <div className="flex flex-col gap-8 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${r.soft} ${r.text}`}>
              {r.label}
            </span>
            <h1 className="mt-3 font-display text-3xl font-medium leading-tight text-ink md:text-4xl">{deal.deal_name}</h1>
            <dl className="mt-6 grid grid-cols-2 gap-y-4 sm:grid-cols-4">
              {[
                { label: 'Value', value: formatMoney(deal.value) },
                { label: 'Close', value: deal.close_date || '—' },
                { label: 'Champion', value: deal.champion || '—' },
                { label: 'Econ. buyer', value: deal.economic_buyer || '—' },
              ].map((m) => (
                <div key={m.label} className="pr-4">
                  <dt className="eyebrow">{m.label}</dt>
                  <dd className="mt-1 truncate text-[15px] font-semibold text-ink">{m.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={deal.score} color={RING[deal.risk_level] || RING.amber} />
            <span className="eyebrow">Health score</span>
          </div>
        </div>
      </section>

      {/* Next step */}
      <section className="mt-6 flex flex-col gap-4 rounded-lg bg-ink p-6 text-bg sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-coral">Recommended next step</div>
          <p className={`mt-1.5 font-display text-xl leading-snug ${done ? 'line-through opacity-60' : ''}`}>{deal.action}</p>
        </div>
        <button
          onClick={() => setDone((d) => !d)}
          className="inline-flex h-10 flex-shrink-0 items-center gap-2 self-start rounded-md border border-bg/30 px-4 text-sm font-medium transition-colors hover:bg-bg/10 sm:self-auto"
          aria-pressed={done}
        >
          <Icon name="check" className="h-4 w-4" strokeWidth={2} />
          {done ? 'Done' : 'Mark as done'}
        </button>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="rounded-lg border border-line bg-surface p-6 lg:col-span-2">
          <h2 className="font-display text-xl font-medium text-ink">Summary</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{deal.narrative || 'No summary returned.'}</p>
        </section>

        <section className="rounded-lg border border-line bg-surface lg:col-span-3">
          <div className="flex items-baseline justify-between border-b border-line px-6 py-4">
            <h2 className="font-display text-xl font-medium text-ink">Signals</h2>
            <span className="eyebrow">What moved the score</span>
          </div>
          {reasons.length === 0 ? (
            <p className="px-6 py-8 text-sm text-ink-2">No individual signals were returned for this deal.</p>
          ) : (
            <ul className="divide-y divide-line">
              {reasons.map((reason, i) => {
                const src = parseSignalSource(reason);
                const ded = extractDeduction(reason);
                return (
                  <li key={i} className="flex items-start gap-3 px-6 py-3.5">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-line bg-bg text-ink-2">
                      <Icon name={src.icon} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium text-ink-3">{src.label}</div>
                      <div className="text-sm text-ink">{cleanReasonText(reason)}</div>
                    </div>
                    {ded && (
                      <span
                        className={`mt-1 flex-shrink-0 rounded px-1.5 py-0.5 font-mono text-[12px] font-medium ${
                          ded.sign === '+' ? 'bg-risk-green/10 text-risk-green' : 'bg-risk-red/10 text-risk-red'
                        }`}
                      >
                        {ded.sign}
                        {ded.value}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Prev / next */}
      <nav className="mt-8 grid grid-cols-2 gap-3" aria-label="Other deals">
        {prev ? (
          <Link
            href={`/app/deal?id=${encodeURIComponent(prev.deal_id)}`}
            className="rounded-md border border-line bg-surface p-4 transition-colors hover:border-line-strong"
          >
            <div className="eyebrow flex items-center gap-1">
              <Icon name="arrowLeft" className="h-3 w-3" /> Previous
            </div>
            <div className="mt-1 truncate text-sm font-semibold text-ink">{prev.deal_name}</div>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/app/deal?id=${encodeURIComponent(next.deal_id)}`}
            className="rounded-md border border-line bg-surface p-4 text-right transition-colors hover:border-line-strong"
          >
            <div className="eyebrow flex items-center justify-end gap-1">
              Next <Icon name="arrowRight" className="h-3 w-3" />
            </div>
            <div className="mt-1 truncate text-sm font-semibold text-ink">{next.deal_name}</div>
          </Link>
        )}
      </nav>
    </div>
  );
}
