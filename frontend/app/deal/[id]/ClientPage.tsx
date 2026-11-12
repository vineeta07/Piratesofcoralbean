'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Logo from '../../../components/Logo';
import ThemeToggle from '../../../components/ThemeToggle';
import Icon from '../../../components/Icon';

/* ------------------------------------------------------------------ */
/*  Sample data — in a real app this would come from an API / context  */
/* ------------------------------------------------------------------ */

const SAMPLE_SCORE = 65;
const SAMPLE_RISK_LEVEL: 'amber' | 'red' | 'green' = 'amber';

const RISK_SIGNALS = [
  {
    severity: 'high' as const,
    title: 'Champion went silent',
    description:
      'No email or Slack reply from the primary champion in the last 14 days.',
  },
  {
    severity: 'medium' as const,
    title: 'Competitor mentioned in call',
    description:
      'Gong transcript from May 20 contains 3 references to a competing vendor.',
  },
  {
    severity: 'low' as const,
    title: 'Legal review pending',
    description:
      'Contract was sent to legal 5 days ago — average turnaround is 3 days.',
  },
];

const ACTIONS = [
  { label: 'Schedule a re-engagement call with champion', done: false },
  { label: 'Prepare competitive battle card for next meeting', done: true },
  { label: 'Follow up with legal on contract status', done: false },
  { label: 'Loop in executive sponsor for strategic alignment', done: false },
];

const TIMELINE = [
  {
    type: 'email' as const,
    title: 'Follow-up email sent',
    detail: 'Sent pricing breakdown to VP Engineering',
    time: '2 hours ago',
  },
  {
    type: 'call' as const,
    title: 'Discovery call completed',
    detail: '45-min call with technical team — positive signals on integration',
    time: '1 day ago',
  },
  {
    type: 'slack' as const,
    title: 'Slack mention detected',
    detail: '#deals-war-room — AE flagged competitor activity',
    time: '3 days ago',
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const severityColor = (s: 'high' | 'medium' | 'low') => {
  if (s === 'high') return { bar: 'bg-risk-red', text: 'text-risk-red' };
  if (s === 'medium') return { bar: 'bg-risk-amber', text: 'text-risk-amber' };
  return { bar: 'bg-risk-green', text: 'text-risk-green' };
};

const riskBadge = (level: 'red' | 'amber' | 'green') => {
  const map = {
    red: { label: 'At risk', cls: 'border-risk-red/40 text-risk-red' },
    amber: { label: 'Watch', cls: 'border-risk-amber/40 text-risk-amber' },
    green: { label: 'On course', cls: 'border-risk-green/40 text-risk-green' },
  };
  return map[level];
};

const scoreColor = (score: number) => {
  if (score >= 75) return 'rgb(var(--risk-green))';
  if (score >= 50) return 'rgb(var(--risk-amber))';
  return 'rgb(var(--risk-red))';
};

const typeIcon = (t: 'email' | 'call' | 'slack') => {
  if (t === 'email')
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    );
  if (t === 'call')
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    );
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Score Gauge component                                              */
/* ------------------------------------------------------------------ */

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.min(Math.max(score, 0), 100);
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-36 w-36 flex-shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(var(--sunken))" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-medium tabular-nums text-ink">{score}</span>
        <span className="font-mono text-[11px] text-ink-3">/ 100</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function DealPage({ params }: { params: { id: string } }) {
  const [actions, setActions] = useState(ACTIONS);
  const toggleAction = (idx: number) =>
    setActions((prev) => prev.map((a, i) => (i === idx ? { ...a, done: !a.done } : a)));
  const badge = riskBadge(SAMPLE_RISK_LEVEL);
  const doneCount = actions.filter((a) => a.done).length;

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Coral Bean home"><Logo /></Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-ink-2 hover:text-ink">
          <Icon name="arrowLeft" className="h-4 w-4" /> Back to dashboard
        </Link>

        {/* Hero */}
        <section className="mb-8 rounded-lg border border-line bg-surface p-6 md:p-8 animate-fade-in-up">
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <div className="eyebrow mb-2">Deal file</div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-medium md:text-4xl">Deal {params.id}</h1>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
              </div>
              <p className="mb-6 max-w-xl text-sm leading-relaxed text-ink-2">
                Risk read built from CRM activity, email cadence, call transcripts, Slack mentions and contract status.
              </p>
              <dl className="grid max-w-lg grid-cols-3 divide-x divide-line border-y border-line">
                {[
                  { label: 'Value', value: '$240,000' },
                  { label: 'Close', value: 'Jun 30, 2026' },
                  { label: 'Stage', value: 'Negotiation' },
                ].map((chip) => (
                  <div key={chip.label} className="px-4 py-3 first:pl-0">
                    <dt className="eyebrow">{chip.label}</dt>
                    <dd className="mt-1 text-[15px] font-semibold text-ink">{chip.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ScoreGauge score={SAMPLE_SCORE} />
              <span className="eyebrow">Health score</span>
            </div>
          </div>
        </section>

        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Risk Signals */}
          <section className="rounded-lg border border-line bg-surface">
            <h2 className="flex items-center gap-2 border-b border-line px-6 py-4 font-display text-xl font-medium">
              <Icon name="alert" className="h-[18px] w-[18px] text-ink-3" /> Risk signals
            </h2>
            <ul className="divide-y divide-line">
              {RISK_SIGNALS.map((signal, i) => {
                const sc = severityColor(signal.severity);
                return (
                  <li key={i} className="relative px-6 py-4">
                    <span className={`absolute inset-y-4 left-0 w-1 rounded-r ${sc.bar}`} aria-hidden />
                    <span className={`font-mono text-[11px] uppercase tracking-wider ${sc.text}`}>{signal.severity}</span>
                    <h3 className="mt-1 text-sm font-semibold text-ink">{signal.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{signal.description}</p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Actions */}
          <section className="flex flex-col rounded-lg border border-line bg-surface">
            <h2 className="flex items-center gap-2 border-b border-line px-6 py-4 font-display text-xl font-medium">
              <Icon name="check" className="h-[18px] w-[18px] text-ink-3" /> Recommended actions
            </h2>
            <ul className="flex-1 divide-y divide-line">
              {actions.map((action, i) => (
                <li key={i}>
                  <button
                    onClick={() => toggleAction(i)}
                    className="flex w-full items-start gap-3 px-6 py-3.5 text-left transition-colors hover:bg-sunken/60"
                    aria-pressed={action.done}
                  >
                    <span
                      className={`mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border ${
                        action.done ? 'border-ink bg-ink text-bg' : 'border-line-strong'
                      }`}
                    >
                      {action.done && <Icon name="check" className="h-3 w-3" strokeWidth={2.5} />}
                    </span>
                    <span className={`text-sm leading-relaxed ${action.done ? 'text-ink-3 line-through' : 'text-ink'}`}>
                      {action.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-6 py-4">
              <div className="mb-2 flex items-center justify-between text-xs text-ink-3">
                <span>Progress</span>
                <span className="font-mono">{doneCount}/{actions.length}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
                <div className="h-full rounded-full bg-coral transition-all duration-500" style={{ width: `${(doneCount / actions.length) * 100}%` }} />
              </div>
            </div>
          </section>
        </div>

        {/* Timeline */}
        <section className="rounded-lg border border-line bg-surface">
          <h2 className="flex items-center gap-2 border-b border-line px-6 py-4 font-display text-xl font-medium">
            <Icon name="compass" className="h-[18px] w-[18px] text-ink-3" /> Activity
          </h2>
          <ol className="relative px-6 py-6">
            <span className="absolute bottom-8 left-[39px] top-8 w-px bg-line" aria-hidden />
            {TIMELINE.map((event, i) => (
              <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                <span className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-2">
                  {typeIcon(event.type)}
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-semibold text-ink">{event.title}</h3>
                    <span className="whitespace-nowrap font-mono text-[11px] text-ink-3">{event.time}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{event.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
