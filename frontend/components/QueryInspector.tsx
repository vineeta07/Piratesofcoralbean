'use client';

import React, { useState, useCallback } from 'react';
import { QueryInspection } from '../lib/types';

interface QueryInspectorProps {
  inspection: QueryInspection | null;
}

/* ─── Icon + color map for the 5 canonical sources ─── */
const SOURCE_META: Record<string, { icon: string; label: string }> = {
  salesforce: { icon: '☁️', label: 'Salesforce' },
  gmail:      { icon: '📧', label: 'Gmail' },
  gong:       { icon: '🎙️', label: 'Gong' },
  slack:      { icon: '💬', label: 'Slack' },
  linkedin:   { icon: '💼', label: 'LinkedIn' },
};

/* ─── Badge color palette keyed by intent field name ─── */
const BADGE_COLORS: Record<string, string> = {
  intent:    'bg-blue-500/20 text-blue-300 border-blue-400/30',
  timeframe: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  signal:    'bg-amber-500/20 text-amber-300 border-amber-400/30',
  scope:     'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
};

function urgencyColor(value: string): string {
  const v = value.toLowerCase();
  if (v === 'high' || v === 'critical') {
    return 'bg-red-500/20 text-red-300 border-red-400/30';
  }
  return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
}

/* ─── Section border accent colors ─── */
const SECTION_ACCENTS: Record<string, string> = {
  intent:  'border-l-blue-500',
  sources: 'border-l-emerald-500',
  sql:     'border-l-cyan-500',
};

/* ─── Chevron icon ─── */
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-white/50 transition-transform duration-300 ${
        open ? 'rotate-0' : '-rotate-90'
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/* ─── Collapsible Section wrapper ─── */
function Section({
  title,
  accent,
  defaultOpen = true,
  children,
}: {
  title: string;
  accent: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`border-l-2 ${accent} rounded-lg bg-white/[0.02] overflow-hidden`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3
                   text-left text-sm font-semibold text-white/80
                   hover:bg-white/[0.03] transition-colors duration-200"
      >
        <span>{title}</span>
        <ChevronIcon open={open} />
      </button>

      {/* Animate collapse via grid‑rows trick for a smooth transition */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Parsed Intent section ─── */
function ParsedIntentSection({
  intent,
}: {
  intent: QueryInspection['intent'];
}) {
  const fields = Object.entries(intent) as [string, string][];

  return (
    <Section title="Parsed Intent" accent={SECTION_ACCENTS.intent}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {fields.map(([key, value]) => {
          const color =
            key === 'urgency' ? urgencyColor(value) : BADGE_COLORS[key] ?? BADGE_COLORS.intent;
          return (
            <div
              key={key}
              className={`rounded-lg border px-3 py-2 ${color} flex flex-col gap-0.5`}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-60 font-medium">
                {key}
              </span>
              <span className="text-xs font-semibold truncate">{value}</span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ─── Data Sources section ─── */
function DataSourcesSection({
  sources,
}: {
  sources: QueryInspection['sources'];
}) {
  /* Build a lookup from the API sources keyed by lowercase name */
  const sourceLookup = new Map(
    sources.map((s) => [s.name.toLowerCase(), s]),
  );

  /* Canonical ordering */
  const canonical = ['salesforce', 'gmail', 'gong', 'slack', 'linkedin'];

  return (
    <Section title="Data Sources" accent={SECTION_ACCENTS.sources}>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {canonical.map((key) => {
          const meta = SOURCE_META[key];
          const source = sourceLookup.get(key);
          const included = source?.included ?? false;

          return (
            <div
              key={key}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3
                transition-all duration-300 text-center
                ${
                  included
                    ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.08)]'
                    : 'bg-gray-500/10 border-gray-500/20 opacity-50'
                }
              `}
            >
              {/* Status badge */}
              <span
                className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center
                  rounded-full text-[10px] font-bold
                  ${
                    included
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-gray-600 text-gray-300'
                  }`}
              >
                {included ? '✓' : '✗'}
              </span>

              <span className="text-2xl leading-none">{meta.icon}</span>
              <span className="text-[11px] font-medium text-white/80">
                {meta.label}
              </span>

              {source?.reason && (
                <span className="text-[9px] leading-tight text-white/40 line-clamp-2">
                  {source.reason}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ─── Generated SQL section ─── */
function GeneratedSQLSection({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback: noop */
    }
  }, [sql]);

  const lines = sql.split('\n');

  return (
    <Section title="Generated SQL" accent={SECTION_ACCENTS.sql}>
      <div className="relative rounded-lg overflow-hidden border border-white/5">
        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md
                     bg-white/10 hover:bg-white/20 border border-white/10
                     px-2.5 py-1 text-[11px] font-medium text-white/60
                     hover:text-white/90 transition-all duration-200
                     backdrop-blur-sm"
        >
          {copied ? (
            <>
              <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </>
          )}
        </button>

        {/* Code block */}
        <div className="bg-black/50 p-4 overflow-x-auto">
          <pre className="text-[13px] leading-relaxed font-mono">
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span className="inline-block w-8 shrink-0 text-right pr-3 select-none text-white/20 text-xs leading-relaxed">
                  {i + 1}
                </span>
                <code className="text-green-300 whitespace-pre">{line}</code>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </Section>
  );
}

/* ─── Main QueryInspector component ─── */
export default function QueryInspector({ inspection }: QueryInspectorProps) {
  if (!inspection) return null;

  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl
                 shadow-xl shadow-black/10 p-4 space-y-3"
    >
      {/* Panel header */}
      <div className="flex items-center gap-2 px-1 pb-1">
        <span className="text-base">🔍</span>
        <h3 className="text-sm font-semibold text-white/70 tracking-wide uppercase">
          Query Inspector
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      <ParsedIntentSection intent={inspection.intent} />
      <DataSourcesSection sources={inspection.sources} />
      <GeneratedSQLSection sql={inspection.generated_sql} />
    </div>
  );
}