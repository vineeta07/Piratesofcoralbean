'use client';

import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

const SAMPLE_QUERIES = [
  { query: 'Show me all deals at risk', label: 'Risk scan' },
  { query: 'Which deals closing this month have gone silent?', label: 'Email silence' },
  { query: 'Forecast revenue for this quarter', label: 'Forecast' },
  { query: 'Deals where champion changed jobs', label: 'Champion risk' },
  { query: 'Show objections from Gong calls', label: 'Objections' },
  { query: 'Competitor mentions in Slack this week', label: 'Competitors' },
  { query: 'Show me deals lacking next steps in calendar', label: 'Momentum' },
  { query: 'List high value deals in negotiation stage', label: 'High value' },
  { query: 'Deals missing economic buyer engagement', label: 'EB signals' },
  { query: 'Deals stuck in legal review', label: 'Legal' },
  { query: 'Which enterprise deals have negative sentiment?', label: 'Sentiment' },
  { query: 'Show deals with no activity in the last 14 days', label: 'Ghosted' },
  { query: 'What are the top 5 deals by value closing next week?', label: 'Top deals' },
  { query: 'Deals where the prospect mentioned pricing concerns', label: 'Pricing' },
  { query: 'Opportunities with recent escalation flags', label: 'Escalations' },
  { query: 'Show me early stage deals with high engagement', label: 'Hot pipeline' },
  { query: 'Which closed lost deals mentioned our main competitor?', label: 'Loss analysis' },
  { query: 'Deals where the economic buyer was absent from the last call', label: 'Missing EB' },
];

interface QueryInputProps {
  query: string;
  setQuery: (q: string) => void;
  onAnalyze: (query: string) => void;
  isLoading: boolean;
}

export default function QueryInput({ query, setQuery, onAnalyze, isLoading }: QueryInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLFormElement>(null);

  const filteredQueries = SAMPLE_QUERIES.filter(
    (sq) =>
      sq.query.toLowerCase().includes(query.toLowerCase()) ||
      sq.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onAnalyze(query);
      setShowDropdown(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative" ref={dropdownRef}>
      <label htmlFor="coral-query" className="sr-only">
        Ask about your pipeline
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-line-strong bg-surface p-1.5 pl-4 shadow-[0_1px_2px_rgb(var(--ink)/0.06)] transition-colors focus-within:border-ink">
        <Icon name="search" className="h-[18px] w-[18px] flex-shrink-0 text-ink-3" />
        <input
          id="coral-query"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={(e) => e.key === 'Escape' && setShowDropdown(false)}
          disabled={isLoading}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[16px] text-ink placeholder:text-ink-3 focus:outline-none focus-visible:outline-none disabled:opacity-60"
          placeholder="Which late-stage deals are stalling?"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="inline-flex h-11 min-w-[112px] items-center justify-center gap-2 rounded-md bg-coral px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:text-bg"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Reading
            </>
          ) : (
            <>
              Analyze
              <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2} />
            </>
          )}
        </button>
      </div>

      {showDropdown && filteredQueries.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-lg border border-line bg-surface shadow-[0_16px_40px_-12px_rgb(0_0_0/0.25)] animate-fade-in">
          <div className="eyebrow border-b border-line px-4 py-2">Suggested questions</div>
          <div className="max-h-64 overflow-y-auto">
            {filteredQueries.map((sq) => (
              <button
                key={sq.query}
                type="button"
                onClick={() => {
                  setQuery(sq.query);
                  setShowDropdown(false);
                }}
                className="flex w-full items-center justify-between gap-4 border-b border-line px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-sunken"
              >
                <span className="text-sm text-ink">{sq.query}</span>
                <span className="flex-shrink-0 font-mono text-[11px] text-ink-3">{sq.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
