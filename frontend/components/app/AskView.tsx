'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import QueryInput from '../QueryInput';
import SummaryStats from '../SummaryStats';
import AgentTracer from '../AgentTracer';
import QueryInspector from '../QueryInspector';
import Icon, { IconName } from '../Icon';
import DownloadButtons from './DownloadButtons';
import { formatMoney, formatWhen, riskOf, sortDeals, useAnalysis } from '../../lib/analysis';

const STARTERS: { icon: IconName; title: string; query: string }[] = [
  { icon: 'alert', title: 'Risk scan', query: 'Show me all deals at risk' },
  { icon: 'mail', title: 'Gone quiet', query: 'Which deals closing this month have gone silent?' },
  { icon: 'briefcase', title: 'Champion moved', query: 'Deals where champion changed jobs' },
  { icon: 'chat', title: 'Competitors', query: 'Competitor mentions in Slack this week' },
  { icon: 'mic', title: 'Objections', query: 'Show objections from Gong calls' },
  { icon: 'pulse', title: 'Forecast', query: 'Forecast revenue for this quarter' },
];

export default function AskView() {
  const { current, isLoading, error, run } = useAnalysis();
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const autoRan = useRef<string | null>(null);

  const wantsNew = params?.get('new') === '1';
  const incoming = params?.get('q');

  // /app?q=... (from the homepage) runs that question straight away.
  useEffect(() => {
    if (incoming && autoRan.current !== incoming) {
      autoRan.current = incoming;
      setQuery(incoming);
      run(incoming).then(() => router.replace('/app'));
    }
  }, [incoming, run, router]);

  useEffect(() => {
    if (wantsNew) setQuery('');
  }, [wantsNew]);

  const ask = async (q: string) => {
    setShowDetails(false);
    const res = await run(q);
    if (res) {
      setQuery('');
      if (wantsNew) router.replace('/app');
    }
  };

  const showResult = !!current && !wantsNew && !isLoading;

  /* ───── Empty / composer state ───── */
  if (!showResult && !isLoading) {
    return (
      <div className="mx-auto max-w-2xl pt-6 lg:pt-14">
        <div className="eyebrow mb-3">New question</div>
        <h1 className="font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">
          What do you want to know about your pipeline?
        </h1>
        <p className="mt-3 text-[15px] text-ink-2">
          Ask in plain English. DealCortex reads Salesforce, Gmail, Gong, Slack and LinkedIn and scores every deal.
        </p>
        <div className="mt-8" data-tour="ask">
          <QueryInput query={query} setQuery={setQuery} onAnalyze={ask} isLoading={isLoading} autoFocus />
        </div>
        {error && <ErrorNote message={error} />}
        <div className="mt-10">
          <div className="eyebrow mb-3">Or start from one of these</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {STARTERS.map((s) => (
              <button
                key={s.query}
                onClick={() => ask(s.query)}
                className="group flex items-start gap-3 rounded-md border border-line bg-surface p-3.5 text-left transition-colors hover:border-line-strong"
              >
                <Icon name={s.icon} className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-3 group-hover:text-coral" />
                <span>
                  <span className="block text-sm font-medium text-ink">{s.title}</span>
                  <span className="block text-[13px] text-ink-2">{s.query}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ───── Running ───── */
  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl pt-6 lg:pt-14">
        <div className="eyebrow mb-3">Working on it</div>
        <h1 className="font-display text-2xl font-medium text-ink">Reading your sources…</h1>
        <p className="mt-2 text-sm text-ink-2">This usually takes a few seconds.</p>
        <div className="mt-8">
          <AgentTracer isRunning />
        </div>
      </div>
    );
  }

  /* ───── Result ───── */
  const a = current!;
  const deals = sortDeals(a.result.dashboard.deals);
  const attention = deals.filter((d) => d.risk_level !== 'green');
  const fine = deals.filter((d) => d.risk_level === 'green');

  return (
    <div className="animate-fade-in-up">
      {/* Ask-again bar */}
      <div className="mb-8" data-tour="ask">
        <QueryInput query={query} setQuery={setQuery} onAnalyze={ask} isLoading={isLoading} placeholder="Ask another question…" />
        {error && <ErrorNote message={error} />}
      </div>

      <div className="mb-6">
        <div className="eyebrow mb-2">{formatWhen(a.at)}</div>
        <h1 className="font-display text-3xl font-medium leading-tight text-ink">{a.query}</h1>
      </div>

      <SummaryStats summary={a.result.dashboard.summary} />

      {/* Export callout */}
      <section className="mb-10 flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-coral/10 text-coral-ink">
            <Icon name="slides" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Take this into your pipeline review</h2>
            <p className="text-[13px] text-ink-2">A formatted PDF report and an editable PowerPoint deck, built from this answer.</p>
          </div>
        </div>
        <DownloadButtons analysis={a} />
      </section>

      {/* Deals */}
      <DealGroup title="Needs attention" deals={attention} empty="Nothing flagged — every deal looks on course." />
      {fine.length > 0 && <DealGroup title="On course" deals={fine} />}

      {/* Details */}
      <section className="mt-10 border-t border-line pt-6">
        <button
          onClick={() => setShowDetails((s) => !s)}
          className="flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink"
          aria-expanded={showDetails}
        >
          <Icon name="chevronDown" className={`h-4 w-4 transition-transform ${showDetails ? '' : '-rotate-90'}`} />
          How this was answered
        </button>
        {showDetails && (
          <div className="mt-5 grid gap-6 animate-fade-in lg:grid-cols-5">
            <div className="lg:col-span-2">
              <AgentTracer isRunning={false} />
            </div>
            <div className="lg:col-span-3">
              {a.result.query_inspection && <QueryInspector inspection={a.result.query_inspection} />}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function DealGroup({ title, deals, empty }: { title: string; deals: ReturnType<typeof sortDeals>; empty?: string }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-medium text-ink">{title}</h2>
        <span className="font-mono text-xs text-ink-3">{deals.length}</span>
      </div>
      {deals.length === 0 ? (
        <p className="rounded-md border border-dashed border-line-strong px-4 py-6 text-center text-sm text-ink-2">{empty}</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {deals.map((d) => {
            const r = riskOf(d.risk_level);
            return (
              <li key={d.deal_id}>
                <Link
                  href={`/app/deal?id=${encodeURIComponent(d.deal_id)}`}
                  className="group relative flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-sunken/50 sm:flex-row sm:items-center sm:gap-6"
                >
                  <span className={`absolute inset-y-0 left-0 w-1 ${r.bar}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                      <span className="truncate font-semibold text-ink">{d.deal_name}</span>
                      <span className={`flex-shrink-0 text-[12px] font-medium ${r.text}`}>{r.label}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[13px] text-ink-2">
                      <span className="text-ink-3">Next:</span> {d.action}
                    </p>
                  </div>
                  <div className="flex items-center gap-5 sm:w-56 sm:justify-end">
                    <div className="flex w-24 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                        <div className={`h-full ${r.bar}`} style={{ width: `${d.score}%` }} />
                      </div>
                      <span className="w-6 text-right font-mono text-[11px] text-ink-3">{d.score}</span>
                    </div>
                    <span className="w-24 text-right font-display text-[17px] tabular-nums text-ink">{formatMoney(d.value)}</span>
                    <Icon name="arrowRight" className="hidden h-4 w-4 text-ink-3 transition-transform group-hover:translate-x-0.5 sm:block" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-md border border-risk-red/30 bg-risk-red/[0.06] p-4 text-sm text-risk-red">
      <Icon name="alert" className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span className="whitespace-pre-wrap">{message}</span>
    </div>
  );
}
