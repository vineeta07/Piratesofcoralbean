'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { analyzeQuery } from './api';
import { ApiResponse, Deal } from './types';

/** One question and the answer the pipeline gave for it. */
export interface Analysis {
  id: string;
  query: string;
  at: string; // ISO timestamp
  result: ApiResponse;
}

interface AnalysisState {
  current: Analysis | null;
  history: Analysis[];
  isLoading: boolean;
  error: string | null;
  run: (query: string) => Promise<Analysis | null>;
  open: (id: string) => void;
  clearHistory: () => void;
  findDeal: (dealId: string) => Deal | undefined;
}

const HISTORY_KEY = 'coralbean.history.v1';
const MAX_HISTORY = 15;

const AnalysisContext = createContext<AnalysisState | null>(null);

function readHistory(): Analysis[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(items: Analysis[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    /* storage full or blocked — history just won't survive a reload */
  }
}

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<Analysis[]>([]);
  const [current, setCurrent] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  // Restore the saved history once on mount; the newest entry becomes current.
  useEffect(() => {
    const saved = readHistory();
    setHistory(saved);
    if (saved.length) setCurrent(saved[0]);
  }, []);

  const run = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q || inFlight.current) return null;
    inFlight.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeQuery(q);
      if (!result.success) {
        setError(result.error || 'The pipeline could not answer that question.');
        return null;
      }
      const entry: Analysis = {
        id: `a-${Date.now().toString(36)}`,
        query: q,
        at: new Date().toISOString(),
        result,
      };
      setCurrent(entry);
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, MAX_HISTORY);
        writeHistory(next);
        return next;
      });
      return entry;
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  }, []);

  const open = useCallback(
    (id: string) => {
      const found = history.find((h) => h.id === id);
      if (found) {
        setCurrent(found);
        setError(null);
      }
    },
    [history],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrent(null);
    writeHistory([]);
  }, []);

  const findDeal = useCallback(
    (dealId: string) => current?.result.dashboard.deals.find((d) => d.deal_id === dealId),
    [current],
  );

  return (
    <AnalysisContext.Provider value={{ current, history, isLoading, error, run, open, clearHistory, findDeal }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used inside <AnalysisProvider>');
  return ctx;
}

/* ───────── shared formatting helpers ───────── */

export const formatMoney = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

export const formatMoneyShort = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
};

export const formatWhen = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export const RISK = {
  red: { label: 'At risk', text: 'text-risk-red', bar: 'bg-risk-red', soft: 'bg-risk-red/[0.07] border-risk-red/25' },
  amber: { label: 'Watch', text: 'text-risk-amber', bar: 'bg-risk-amber', soft: 'bg-risk-amber/[0.08] border-risk-amber/25' },
  green: { label: 'On course', text: 'text-risk-green', bar: 'bg-risk-green', soft: 'bg-risk-green/[0.07] border-risk-green/25' },
} as const;

export const riskOf = (level: string) => RISK[level as keyof typeof RISK] ?? RISK.amber;

/** Highest-risk first, then by value. */
export const sortDeals = (deals: Deal[]) => {
  const order = { red: 0, amber: 1, green: 2 } as Record<string, number>;
  return [...deals].sort((a, b) => (order[a.risk_level] ?? 1) - (order[b.risk_level] ?? 1) || b.value - a.value);
};
