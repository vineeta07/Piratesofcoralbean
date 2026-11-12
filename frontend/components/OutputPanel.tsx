'use client';

import { useState, useCallback, useMemo } from 'react';
import { ApiResponse } from '../lib/types';
import Icon from './Icon';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OutputPanelProps {
  data: ApiResponse;
}

type TabId = 'dashboard' | 'slack' | 'documents' | 'raw';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'slack', label: 'Slack' },
  { id: 'documents', label: 'Documents' },
  { id: 'raw', label: 'Raw' },
];

function DocumentCard({ title, description, href, badge }: { title: string; description: string; href?: string; badge: string }) {
  return (
    <div className="flex flex-col rounded-md border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-9 flex-shrink-0 items-end justify-center rounded-sm border border-line-strong bg-bg pb-1 font-mono text-[9px] font-medium text-coral-ink">
          {badge}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink">{title}</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{description}</p>
        </div>
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-medium text-coral-ink hover:underline"
        >
          Download <Icon name="arrowUpRight" className="h-3.5 w-3.5" strokeWidth={2} />
        </a>
      ) : (
        <div className="mt-4 text-[12px] text-ink-3">Not returned by the backend yet.</div>
      )}
    </div>
  );
}

// ─── JsonSyntax – recursive React JSON renderer ─────────────────────────────

interface JsonSyntaxProps {
  value: unknown;
  indent?: number;
}

function JsonSyntax({ value, indent = 0 }: JsonSyntaxProps) {
  const pad = '  '.repeat(indent);
  const innerPad = '  '.repeat(indent + 1);

  // ── null ──
  if (value === null) {
    return <span className="text-ink-3">null</span>;
  }

  // ── undefined (treat as null for display) ──
  if (value === undefined) {
    return <span className="text-ink-3">undefined</span>;
  }

  // ── boolean ──
  if (typeof value === 'boolean') {
    return <span className="text-coral-ink">{value.toString()}</span>;
  }

  // ── number ──
  if (typeof value === 'number') {
    return <span className="text-risk-amber">{value}</span>;
  }

  // ── string ──
  if (typeof value === 'string') {
    return <span className="text-risk-green">&quot;{value}&quot;</span>;
  }

  // ── array ──
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span>{'[]'}</span>;
    }

    return (
      <span>
        {'[\n'}
        {value.map((item, i) => (
          <span key={i}>
            {innerPad}
            <JsonSyntax value={item} indent={indent + 1} />
            {i < value.length - 1 ? ',' : ''}
            {'\n'}
          </span>
        ))}
        {pad}{']'}
      </span>
    );
  }

  // ── object ──
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);

    if (entries.length === 0) {
      return <span>{'{}'}</span>;
    }

    return (
      <span>
        {'{\n'}
        {entries.map(([key, val], i) => (
          <span key={key}>
            {innerPad}
            <span className="text-sea">&quot;{key}&quot;</span>
            <span className="text-ink-3">{': '}</span>
            <JsonSyntax value={val} indent={indent + 1} />
            {i < entries.length - 1 ? ',' : ''}
            {'\n'}
          </span>
        ))}
        {pad}{'}'}
      </span>
    );
  }

  // ── fallback ──
  return <span>{String(value)}</span>;
}

// ─── Copy Button ─────────────────────────────────────────────────────────────

interface CopyButtonProps {
  text: string;
}

function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`
        absolute top-3 right-3 z-10
        flex items-center gap-1.5 px-2 py-1 rounded
        text-xs font-medium
        transition-all duration-200 ease-out
        ${
          copied
            ? 'border border-risk-green/40 bg-surface text-risk-green'
            : 'border border-line bg-surface text-ink-2 hover:text-ink'
        }
      `}
      aria-label={copied ? 'Copied' : 'Copy to clipboard'}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

// ─── Chevron Icon ────────────────────────────────────────────────────────────

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-ink-3 transition-transform duration-300 ease-out ${
        collapsed ? '-rotate-90' : 'rotate-0'
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

// ─── OutputPanel ─────────────────────────────────────────────────────────────

export default function OutputPanel({ data }: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  // Derive plain-text JSON for each tab (used for copy)
  const jsonStrings = useMemo(
    () => ({
      dashboard: JSON.stringify(data.dashboard, null, 2),
      slack: JSON.stringify(data.slack, null, 2),
      documents: JSON.stringify(data.documents || {}, null, 2),
      raw: JSON.stringify(data, null, 2),
    }),
    [data],
  );

  // Derive the data value for the active tab's rendered JSON
  const activeData = useMemo(() => {
    switch (activeTab) {
      case 'dashboard':
        return data.dashboard;
      case 'slack':
        return data.slack;
      case 'documents':
        return data.documents || {};
      case 'raw':
        return data;
    }
  }, [activeTab, data]);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between border-b border-line px-5 py-3.5 transition-colors hover:bg-sunken/60"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <Icon name="terminal" className="h-4 w-4 text-ink-3" />
          <h2 className="font-display text-[17px] font-medium text-ink">Deliverables</h2>
        </div>
        <ChevronIcon collapsed={collapsed} />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          collapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
        }`}
      >
        <div className="grid gap-3 border-b border-line bg-sunken/50 p-4 sm:grid-cols-2 lg:grid-cols-1">
          <DocumentCard
            title="Executive brief"
            description="A Word brief on deal risk, priority actions and reasoning for leadership."
            href={data.documents?.docx_url}
            badge="DOCX"
          />
          <DocumentCard
            title="Board deck"
            description="A PowerPoint deck with deal health visuals and talking points."
            href={data.documents?.pptx_url}
            badge="PPTX"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto border-b border-line px-3 scrollbar-none" role="tablist">
          <span className="eyebrow mr-2 pl-2">JSON</span>
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  isActive ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
                }`}
              >
                {tab.label}
                <span
                  className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full ${isActive ? 'bg-coral' : 'bg-transparent'}`}
                />
              </button>
            );
          })}
        </div>

        <div className="p-4">
          <div className="relative rounded-md border border-line bg-sunken">
            <CopyButton text={jsonStrings[activeTab]} />
            <div className="max-h-[440px] overflow-auto p-4">
              <pre className="whitespace-pre font-mono text-[12.5px] leading-relaxed text-ink-2">
                <JsonSyntax value={activeData} />
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
