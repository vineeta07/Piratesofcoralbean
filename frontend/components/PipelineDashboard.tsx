'use client';

import React, { useState } from 'react';
import QueryInput from './QueryInput';
import SummaryStats from './SummaryStats';
import DealsList from './DealsList';
import SlackDigest from './SlackDigest';
import { analyzeQuery } from '../lib/api';
import { ApiResponse } from '../lib/types';

export default function PipelineDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeQuery(query);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to analyze deals. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-800 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4 tracking-tight">
            Sales Deal Intelligence
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Coral Agent analyzes 5 different data sources to find the truth behind your deals.
          </p>
        </header>

        <QueryInput onAnalyze={handleAnalyze} isLoading={isLoading} />

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        {data && data.dashboard && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in-up">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-2">Live Pipeline</h2>
              <SummaryStats summary={data.dashboard.summary} />
              <DealsList deals={data.dashboard.deals} />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-2">Outputs</h2>
              <SlackDigest slack={data.slack} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}