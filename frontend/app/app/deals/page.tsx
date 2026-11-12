'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader, NoAnalysis } from '../../../components/app/AppShell';
import Icon from '../../../components/Icon';
import { formatMoney, riskOf, sortDeals, useAnalysis } from '../../../lib/analysis';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'red', label: 'At risk' },
  { id: 'amber', label: 'Watch' },
  { id: 'green', label: 'On course' },
] as const;

export default function PipelinePage() {
  const { current } = useAnalysis();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const [search, setSearch] = useState('');

  const deals = useMemo(() => sortDeals(current?.result.dashboard.deals ?? []), [current]);
  const shown = deals.filter(
    (d) =>
      (filter === 'all' || d.risk_level === filter) &&
      (!search || `${d.deal_name} ${d.champion}`.toLowerCase().includes(search.toLowerCase())),
  );
  const total = deals.reduce((t, d) => t + d.value, 0);
  const atRisk = deals.filter((d) => d.risk_level === 'red').reduce((t, d) => t + d.value, 0);

  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Every deal, sorted by risk"
        desc={current ? <>From your latest question: &ldquo;{current.query}&rdquo;</> : undefined}
      />

      {!current ? (
        <NoAnalysis what="your deals" />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            <Stat label="Deals" value={String(deals.length)} />
            <Stat label="Pipeline value" value={formatMoney(total)} />
            <Stat label="Value at risk" value={formatMoney(atRisk)} tone="text-risk-red" />
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 rounded-md border border-line bg-surface p-1" role="tablist">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={`rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    filter === f.id ? 'bg-ink text-bg' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <label className="flex h-10 items-center gap-2 rounded-md border border-line bg-surface px-3 focus-within:border-ink sm:w-64">
              <Icon name="search" className="h-4 w-4 text-ink-3" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a deal or champion"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-3 focus:outline-none focus-visible:outline-none"
              />
            </label>
          </div>

          <div className="overflow-x-auto rounded-lg border border-line bg-surface">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  {['Deal', 'Status', 'Score', 'Champion', 'Close', 'Value'].map((h, i) => (
                    <th key={h} className={`eyebrow px-4 py-3 font-normal ${i === 5 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((d) => {
                  const r = riskOf(d.risk_level);
                  const href = `/app/deal?id=${encodeURIComponent(d.deal_id)}`;
                  return (
                    <tr key={d.deal_id} className="transition-colors hover:bg-sunken/50">
                      <td className="px-4 py-3">
                        <Link href={href} className="font-semibold text-ink hover:text-coral-ink">
                          {d.deal_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${r.text}`}>
                          <span className={`h-2 w-2 rounded-full ${r.bar}`} />
                          {r.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-ink-2">{d.score}</td>
                      <td className="px-4 py-3 text-ink-2">{d.champion}</td>
                      <td className="px-4 py-3 text-ink-2">{d.close_date || '—'}</td>
                      <td className="px-4 py-3 text-right font-display tabular-nums text-ink">{formatMoney(d.value)}</td>
                    </tr>
                  );
                })}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-2">
                      No deals match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

function Stat({ label, value, tone = 'text-ink' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="eyebrow">{label}</div>
      <div className={`mt-1 font-display text-2xl font-medium tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}
