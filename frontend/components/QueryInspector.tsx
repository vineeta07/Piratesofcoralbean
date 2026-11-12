'use client';

import React, { useState, useCallback } from 'react';
import { QueryInspection } from '../lib/types';
import Icon, { SOURCES } from './Icon';

interface QueryInspectorProps {
  inspection: QueryInspection | null;
}

const URGENT = new Set(['high', 'critical']);

/* ─── Chevron icon ─── */
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-ink-3 transition-transform duration-300 ${
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
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-line first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-5 py-3 text-left transition-colors hover:bg-sunken/60"
      >
        <span className="eyebrow">{title}</span>
        <ChevronIcon open={open} />
      </button>

      {/* Animate collapse via grid‑rows trick for a smooth transition */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1">{children}</div>
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
    <Section title="Parsed intent">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
        {fields.map(([key, value]) => (
          <div key={key} className="bg-surface px-3 py-2.5">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-3">{key}</dt>
            <dd
              className={`mt-0.5 truncate text-[13px] font-medium ${
                key === 'urgency' && URGENT.has(String(value).toLowerCase()) ? 'text-risk-red' : 'text-ink'
              }`}
              title={value}
            >
              {String(value).replace(/_/g, ' ')}
            </dd>
          </div>
        ))}
      </dl>
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
    <Section title="Data sources">
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        {canonical.map((key) => {
          const meta = SOURCES[key];
          const source = sourceLookup.get(key);
          const included = source?.included ?? false;
          return (
            <li
              key={key}
              className={`rounded-md border px-3 py-2.5 ${
                included ? 'border-ink/30 bg-surface' : 'border-dashed border-line-strong bg-transparent opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon name={meta.icon} className="h-4 w-4 text-ink-2" />
                <span className={`font-mono text-[10px] uppercase ${included ? 'text-risk-green' : 'text-ink-3'}`}>
                  {included ? 'Read' : 'Skipped'}
                </span>
              </div>
              <div className="mt-2 text-[13px] font-medium text-ink">{meta.label}</div>
              {source?.reason && (
                <div className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-ink-3">{source.reason}</div>
              )}
            </li>
          );
        })}
      </ul>
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

  const formatSql = (sql: string) => {
    if (!sql) return '';
    return sql
      .replace(/\s+/g, ' ')
      .replace(/ SELECT /gi, 'SELECT\n  ')
      .replace(/^SELECT /gi, 'SELECT\n  ')
      .replace(/ FROM /gi, '\nFROM\n  ')
      .replace(/ LEFT JOIN /gi, '\nLEFT JOIN\n  ')
      .replace(/ RIGHT JOIN /gi, '\nRIGHT JOIN\n  ')
      .replace(/ INNER JOIN /gi, '\nINNER JOIN\n  ')
      .replace(/ JOIN /gi, '\nJOIN\n  ')
      .replace(/ WHERE /gi, '\nWHERE\n  ')
      .replace(/ GROUP BY /gi, '\nGROUP BY\n  ')
      .replace(/ ORDER BY /gi, '\nORDER BY\n  ')
      .replace(/ LIMIT /gi, '\nLIMIT\n  ');
  };

  const formattedSql = formatSql(sql);
  const lines = formattedSql.split('\n');

  return (
    <Section title="Generated Coral SQL">
      <div className="relative overflow-hidden rounded-md border border-line">
        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded border border-line bg-surface px-2 py-1 text-[11px] font-medium text-ink-2 transition-colors hover:text-ink"
        >
          {copied ? (
            <>
              <svg className="w-3 h-3 text-risk-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        <div className="overflow-x-auto bg-sunken p-4">
          <pre className="text-[13px] leading-relaxed font-mono">
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span className="inline-block w-8 shrink-0 text-right pr-3 select-none text-ink-3/60 text-xs leading-relaxed">
                  {i + 1}
                </span>
                <code className="whitespace-pre text-ink">{line}</code>
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
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
        <Icon name="search" className="h-4 w-4 text-ink-3" />
        <h3 className="font-display text-[17px] font-medium text-ink">Query inspector</h3>
      </div>
      <ParsedIntentSection intent={inspection.intent} />
      <DataSourcesSection sources={inspection.sources} />
      <GeneratedSQLSection sql={inspection.generated_sql} />
    </div>
  );
}
