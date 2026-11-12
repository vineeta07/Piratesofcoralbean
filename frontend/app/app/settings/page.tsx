'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '../../../components/app/AppShell';
import { startTour } from '../../../components/app/Tour';
import Icon from '../../../components/Icon';
import {
  applyPalette,
  applyThemePref,
  Palette,
  readPalette,
  readThemePref,
  ThemePref,
} from '../../../components/ThemeToggle';
import { useAnalysis } from '../../../lib/analysis';
import { API_URL } from '../../../lib/api';

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line py-8 md:grid-cols-3">
      <div>
        <h2 className="font-semibold text-ink">{title}</h2>
        {desc && <p className="mt-1 text-sm text-ink-2">{desc}</p>}
      </div>
      <div className="md:col-span-2">{children}</div>
    </section>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T | null;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="inline-flex gap-1 rounded-md border border-line bg-surface p-1" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === o.id ? 'bg-ink text-bg' : 'text-ink-2 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { history, clearHistory } = useAnalysis();
  const [theme, setTheme] = useState<ThemePref | null>(null);
  const [palette, setPalette] = useState<Palette | null>(null);
  const [health, setHealth] = useState<'idle' | 'checking' | 'ok' | 'down'>('idle');

  useEffect(() => {
    setTheme(readThemePref());
    setPalette(readPalette());
  }, []);

  const checkHealth = async () => {
    setHealth('checking');
    try {
      const res = await fetch(`${API_URL}/health`, { cache: 'no-store' });
      setHealth(res.ok ? 'ok' : 'down');
    } catch {
      setHealth('down');
    }
  };

  return (
    <>
      <PageHeader eyebrow="Settings" title="Settings" />

      <Section title="Appearance" desc="Saved in this browser.">
        <div className="space-y-4">
          <div>
            <div className="eyebrow mb-2">Theme</div>
            <Segmented
              label="Theme"
              value={theme}
              options={[
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
                { id: 'system', label: 'System' },
              ]}
              onChange={(v) => {
                applyThemePref(v);
                setTheme(v);
              }}
            />
          </div>
          <div>
            <div className="eyebrow mb-2">Palette</div>
            <Segmented
              label="Palette"
              value={palette}
              options={[
                { id: 'coral', label: 'Coral' },
                { id: 'mono', label: 'Black & white' },
              ]}
              onChange={(v) => {
                applyPalette(v);
                setPalette(v);
              }}
            />
          </div>
        </div>
      </Section>

      <Section title="Account" desc="Sign-in isn’t switched on yet.">
        <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sunken font-display text-lg font-semibold text-ink-2">
            G
          </span>
          <div className="flex-1">
            <div className="font-semibold text-ink">Guest</div>
            <div className="text-sm text-ink-3">Your questions are stored only in this browser.</div>
          </div>
          <Link href="/login" className="h-9 rounded-md border border-line-strong px-3 text-sm font-medium leading-9 text-ink hover:border-ink">
            Sign in
          </Link>
        </div>
      </Section>

      <Section title="Backend" desc="Where questions are sent.">
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink-2">{API_URL}</code>
          <div className="flex items-center gap-3">
            {health === 'ok' && <span className="text-sm text-risk-green">Reachable</span>}
            {health === 'down' && <span className="text-sm text-risk-red">Not reachable</span>}
            <button
              onClick={checkHealth}
              disabled={health === 'checking'}
              className="h-9 rounded-md border border-line-strong px-3 text-sm font-medium text-ink hover:border-ink disabled:opacity-60"
            >
              {health === 'checking' ? 'Checking…' : 'Test connection'}
            </button>
          </div>
        </div>
      </Section>

      <Section title="Help">
        <button
          onClick={startTour}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong px-3 text-sm font-medium text-ink hover:border-ink"
        >
          <Icon name="compass" className="h-4 w-4" /> Replay the tour
        </button>
      </Section>

      <Section title="Data" desc={`${history.length} saved question${history.length === 1 ? '' : 's'}.`}>
        <button
          onClick={() => {
            if (window.confirm('Clear all saved questions from this browser?')) clearHistory();
          }}
          disabled={!history.length}
          className="h-9 rounded-md border border-line px-3 text-sm text-ink-2 hover:border-risk-red/50 hover:text-risk-red disabled:opacity-50"
        >
          Clear history
        </button>
      </Section>
    </>
  );
}
