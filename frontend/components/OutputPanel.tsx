'use client';

import { useState, useCallback, useMemo } from 'react';
import { ApiResponse } from '../lib/types';

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
  { id: 'dashboard', label: 'Dashboard JSON' },
  { id: 'slack', label: 'Slack Preview' },
  { id: 'documents', label: 'Documents JSON' },
  { id: 'raw', label: 'Raw Response' },
];

function DocumentCard({ title, description, href, badge }: { title: string; description: string; href?: string; badge: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <p className="mt-1 text-xs leading-relaxed text-gray-400">{description}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-300">
          {badge}
        </span>
      </div>

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-500/15 px-3 py-2 text-sm font-medium text-blue-200 transition-colors hover:bg-blue-500/25"
        >
          Open file
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H18m0 0v4.5m0-4.5L10 14.5" />
          </svg>
        </a>
      ) : (
        <div className="mt-4 text-xs text-gray-500">Not available from the backend response yet.</div>
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
    return <span className="text-gray-500">null</span>;
  }

  // ── undefined (treat as null for display) ──
  if (value === undefined) {
    return <span className="text-gray-500">undefined</span>;
  }

  // ── boolean ──
  if (typeof value === 'boolean') {
    return <span className="text-purple-300">{value.toString()}</span>;
  }

  // ── number ──
  if (typeof value === 'number') {
    return <span className="text-amber-300">{value}</span>;
  }

  // ── string ──
  if (typeof value === 'string') {
    return <span className="text-green-300">&quot;{value}&quot;</span>;
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
            <span className="text-blue-300">&quot;{key}&quot;</span>
            <span className="text-gray-400">{': '}</span>
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
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
        text-xs font-medium
        transition-all duration-200 ease-out
        ${
          copied
            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-gray-200'
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
      className={`w-5 h-5 text-gray-400 transition-transform duration-300 ease-out ${
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
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 ease-out">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          {/* Terminal-style icon */}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-white font-semibold text-base tracking-tight">Pipeline Output</h2>
        </div>
        <ChevronIcon collapsed={collapsed} />
      </button>

      {/* ── Collapsible body ───────────────────────────────────────────── */}
      <div
        className={`transition-all duration-300 ease-out overflow-hidden ${
          collapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
        }`}
      >
        <div className="border-b border-white/5 px-6 py-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Generated Deliverables</h3>
              <p className="text-xs text-gray-500">DOCX and PPTX assets created by the AI agents from the latest analysis.</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300 border border-emerald-500/20">
              PPT + Docs
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <DocumentCard
              title="Executive Brief"
              description="A shareable Word brief summarizing deal risk, priority actions, and reasoning for leadership review."
              href={data.documents?.docx_url}
              badge="DOCX"
            />
            <DocumentCard
              title="Board Deck"
              description="A PowerPoint deck with deal health visuals and talking points for the live demo or follow-up."
              href={data.documents?.pptx_url}
              badge="PPTX"
            />
          </div>
        </div>

        {/* ── Tab bar ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 px-6 border-b border-white/5">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-4 py-2.5 text-sm font-medium
                  transition-colors duration-200 ease-out
                  ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'}
                `}
              >
                {tab.label}
                {/* Active indicator */}
                <span
                  className={`
                    absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full
                    transition-all duration-200 ease-out
                    ${isActive ? 'bg-blue-500 opacity-100' : 'bg-transparent opacity-0'}
                  `}
                />
              </button>
            );
          })}
        </div>

        {/* ── Code content ───────────────────────────────────────────── */}
        <div className="p-4">
          <div className="relative bg-black/40 rounded-lg border border-white/5">
            <CopyButton text={jsonStrings[activeTab]} />

            <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <pre className="font-mono text-sm leading-relaxed text-gray-300 whitespace-pre">
                <JsonSyntax value={activeData} />
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}