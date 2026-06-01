'use client';

import React, { useState, useRef, useEffect } from 'react';

const SAMPLE_QUERIES = [
  { query: 'Show me all deals at risk', label: '🔴 Risk Scan' },
  { query: 'Which deals closing this month have gone silent?', label: '📧 Email Silence' },
  { query: 'Forecast revenue for this quarter', label: '📊 Forecast' },
  { query: 'Deals where champion changed jobs', label: '💼 Champion Risk' },
  { query: 'Show objections from Gong calls', label: '🎙️ Objections' },
  { query: 'Competitor mentions in Slack this week', label: '⚔️ Competitors' },
  { query: 'Show me deals lacking next steps in calendar', label: '📅 Momentum' },
  { query: 'List high value deals in negotiation stage', label: '💰 High Value' },
  { query: 'Deals missing economic buyer engagement', label: '👔 EB Signals' },
  { query: 'Deals stuck in legal review', label: '⚖️ Legal Blockers' },
];

interface QueryInputProps {
  onAnalyze: (query: string) => void;
  isLoading: boolean;
}

export default function QueryInput({ onAnalyze, isLoading }: QueryInputProps) {
  const [query, setQuery] = useState("Show me all deals at risk");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter queries based on input
  const filteredQueries = SAMPLE_QUERIES.filter(sq => 
    sq.query.toLowerCase().includes(query.toLowerCase()) || 
    sq.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onAnalyze(query);
      setShowDropdown(false);
    }
  };

  const handleSelect = (q: string) => {
    setQuery(q);
    setShowDropdown(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl mb-8 transition-all">
      <h2 className="text-xl font-bold text-white mb-4">Ask Coral</h2>
      <form onSubmit={handleSubmit} className="flex gap-4">
        <div className="flex-1 relative" ref={dropdownRef}>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            disabled={isLoading}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="e.g. Which late stage deals are stalling?"
            autoComplete="off"
          />
          
          {/* Dropdown for suggestions */}
          {showDropdown && filteredQueries.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                {filteredQueries.map((sq, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(sq.query)}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 flex items-center justify-between group"
                  >
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{sq.query}</span>
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-md">{sq.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all flex items-center justify-center min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            "Analyze"
          )}
        </button>
      </form>
    </div>
  );
}
