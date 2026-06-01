'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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
  if (s === 'high') return { dot: 'bg-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' };
  if (s === 'medium') return { dot: 'bg-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' };
  return { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' };
};

const riskBadge = (level: 'red' | 'amber' | 'green') => {
  const map = {
    red: { label: 'High Risk', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
    amber: { label: 'Medium Risk', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    green: { label: 'Low Risk', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  };
  return map[level];
};

const scoreColor = (score: number) => {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
};

const typeIcon = (t: 'email' | 'call' | 'slack') => {
  if (t === 'email')
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    );
  if (t === 'call')
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    );
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Score Gauge component                                              */
/* ------------------------------------------------------------------ */

function ScoreGauge({ score }: { score: number }) {
  const color = scoreColor(score);
  const pct = Math.min(Math.max(score, 0), 100);

  return (
    <div className="relative w-40 h-40 flex-shrink-0">
      {/* Background ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.06) ${pct * 3.6}deg)`,
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 12px), black calc(100% - 11px))',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 12px), black calc(100% - 11px))',
        }}
      />
      {/* Glow effect */}
      <div
        className="absolute inset-2 rounded-full opacity-30 blur-md"
        style={{
          background: `conic-gradient(${color} ${pct * 3.6}deg, transparent ${pct * 3.6}deg)`,
        }}
      />
      {/* Inner content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-white tabular-nums">{score}</span>
        <span className="text-xs text-gray-400 tracking-wider uppercase mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function DealPage({ params }: { params: { id: string } }) {
  const [actions, setActions] = useState(ACTIONS);

  const toggleAction = (idx: number) => {
    setActions((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, done: !a.done } : a)),
    );
  };

  const badge = riskBadge(SAMPLE_RISK_LEVEL);

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-800 to-black text-white selection:bg-purple-500/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Back link ─────────────────────────────────────────── */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </span>
          Back to Dashboard
        </Link>

        {/* ── Hero section ──────────────────────────────────────── */}
        <section className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-10 mb-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-[fadeIn_0.5s_ease-out]">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Left: text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight truncate">
                  Deal {params.id}
                </h1>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xl mb-6">
                Comprehensive risk analysis powered by cross-referencing CRM activity, email sentiment, call transcripts, Slack mentions, and contract status.
              </p>

              {/* Info chips */}
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Value', value: '$240,000' },
                  { label: 'Close Date', value: 'Jun 30, 2026' },
                  { label: 'Stage', value: 'Negotiation' },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm"
                  >
                    <span className="text-gray-500 font-medium">{chip.label}</span>
                    <span className="text-white font-semibold">{chip.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: gauge */}
            <div className="flex flex-col items-center gap-2">
              <ScoreGauge score={SAMPLE_SCORE} />
              <span className="text-xs text-gray-500 tracking-widest uppercase">Risk Score</span>
            </div>
          </div>
        </section>

        {/* ── Two-column grid ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Risk Signals */}
          <section className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-[fadeIn_0.6s_ease-out]">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20">
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </span>
              Risk Signals
            </h2>
            <div className="space-y-4">
              {RISK_SIGNALS.map((signal, i) => {
                const sc = severityColor(signal.severity);
                return (
                  <div
                    key={i}
                    className={`rounded-xl p-4 border ${sc.bg} ${sc.border} transition-all hover:scale-[1.01]`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${sc.text}`}>
                        {signal.severity}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{signal.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{signal.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recommended Actions */}
          <section className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-[fadeIn_0.7s_ease-out]">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </span>
              Recommended Actions
            </h2>
            <div className="space-y-3">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => toggleAction(i)}
                  className={`w-full flex items-start gap-3 rounded-xl p-4 border transition-all text-left group hover:bg-white/5 ${
                    action.done
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-white/[0.02] border-white/10'
                  }`}
                >
                  {/* Checkbox */}
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      action.done
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-gray-600 group-hover:border-gray-400'
                    }`}
                  >
                    {action.done && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </span>
                  <span
                    className={`text-sm leading-relaxed transition-all ${
                      action.done ? 'text-gray-500 line-through' : 'text-gray-300'
                    }`}
                  >
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
            {/* Progress bar */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Progress</span>
                <span>{actions.filter((a) => a.done).length}/{actions.length} completed</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(actions.filter((a) => a.done).length / actions.length) * 100}%` }}
                />
              </div>
            </div>
          </section>
        </div>

        {/* ── Activity Timeline ─────────────────────────────────── */}
        <section className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-[fadeIn_0.8s_ease-out]">
          <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </span>
            Activity Timeline
          </h2>

          <div className="relative pl-8">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-blue-500/40 via-purple-500/40 to-transparent" />

            <div className="space-y-8">
              {TIMELINE.map((event, i) => (
                <div key={i} className="relative group">
                  {/* Dot */}
                  <span className="absolute -left-8 top-1 w-[22px] h-[22px] rounded-full bg-slate-800 border-2 border-blue-500/50 flex items-center justify-center group-hover:border-blue-400 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                  </span>

                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 hover:bg-white/[0.06] transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-blue-400">{typeIcon(event.type)}</span>
                      <h3 className="text-sm font-semibold text-white">{event.title}</h3>
                      <span className="ml-auto text-xs text-gray-600 whitespace-nowrap">{event.time}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed ml-7">{event.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
