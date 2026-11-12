'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, NoAnalysis } from '../../../components/app/AppShell';
import DownloadButtons from '../../../components/app/DownloadButtons';
import { formatWhen, useAnalysis } from '../../../lib/analysis';

export default function HistoryPage() {
  const { history, current, open, clearHistory } = useAnalysis();
  const router = useRouter();

  return (
    <>
      <PageHeader
        eyebrow="History"
        title="Questions you&rsquo;ve asked"
        desc="Saved in this browser. Open one to see its results again, or export it."
        actions={
          history.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all saved questions from this browser?')) clearHistory();
              }}
              className="h-9 rounded-md border border-line px-3 text-sm text-ink-2 hover:border-risk-red/50 hover:text-risk-red"
            >
              Clear history
            </button>
          )
        }
      />

      {history.length === 0 ? (
        <NoAnalysis what="your past questions" />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {history.map((h) => {
            const s = h.result.dashboard.summary;
            return (
              <li key={h.id} className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center">
                <button
                  onClick={() => {
                    open(h.id);
                    router.push('/app');
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    {current?.id === h.id && <span className="h-1.5 w-1.5 rounded-full bg-coral" aria-label="Current" />}
                    <span className="truncate font-semibold text-ink hover:text-coral-ink">{h.query}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-3">
                    <span>{formatWhen(h.at)}</span>
                    <span>{s.total_deals} deals</span>
                    {s.red_count > 0 && <span className="text-risk-red">{s.red_count} at risk</span>}
                    {s.amber_count > 0 && <span className="text-risk-amber">{s.amber_count} watch</span>}
                  </div>
                </button>
                <DownloadButtons analysis={h} size="sm" />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
