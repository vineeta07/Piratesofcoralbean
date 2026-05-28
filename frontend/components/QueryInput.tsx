import React, { useState } from 'react';

interface QueryInputProps {
  onAnalyze: (query: str) => void;
  isLoading: boolean;
}

export default function QueryInput({ onAnalyze, isLoading }: QueryInputProps) {
  const [query, setQuery] = useState("Show me deals at risk this month");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onAnalyze(query);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl mb-8 transition-all">
      <h2 className="text-xl font-bold text-white mb-4">Ask Coral</h2>
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="e.g. Which late stage deals are stalling?"
        />
        <button
          type="submit"
          disabled={isLoading}
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
