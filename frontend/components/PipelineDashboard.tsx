'use client';

import React, { useState, useCallback } from 'react';
import QueryInput from './QueryInput';
import SummaryStats from './SummaryStats';
import DealsList from './DealsList';
import SlackDigest from './SlackDigest';
import AgentTracer from './AgentTracer';
import QueryInspector from './QueryInspector';
import OutputPanel from './OutputPanel';
import ChatInterface from './ChatInterface';
import { analyzeQuery } from '../lib/api';
import { ApiResponse } from '../lib/types';

export default function PipelineDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showTracer, setShowTracer] = useState(false);

  const handleAnalyze = async (query: string) => {
    setIsLoading(true);
    setShowTracer(true);
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

  const handleChatQuery = useCallback(async (query: string): Promise<ApiResponse> => {
    const result = await analyzeQuery(query);
    setData(result);
    return result;
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-800 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4 tracking-tight">
            Sales Deal Intelligence
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Coral Agent analyzes 5 different data sources to find the truth behind your deals.
          </p>
        </header>

        {/* Query Input */}
        <QueryInput onAnalyze={handleAnalyze} isLoading={isLoading} />

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Agent Tracer — shows during & after loading */}
        {showTracer && (
          <div className="mb-8 animate-fade-in">
            <AgentTracer isRunning={isLoading} />
          </div>
        )}

        {/* Query Inspector — shows after results */}
        {data && data.query_inspection && (
          <div className="mb-8 animate-fade-in-up">
            <QueryInspector inspection={data.query_inspection} />
          </div>
        )}

        {/* Main Results Grid */}
        {data && data.dashboard && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in-up">
            {/* Left Column — Pipeline Data */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-2 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Live Pipeline
              </h2>
              <SummaryStats summary={data.dashboard.summary} />
              <DealsList deals={data.dashboard.deals} />
            </div>
            
            {/* Right Column — Outputs */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-2 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Outputs
              </h2>
              <SlackDigest slack={data.slack} />
              <div className="mt-6">
                <OutputPanel data={data} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-500/40 ${
          isChatOpen ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100'
        }`}
        aria-label="Open chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Chat Interface Overlay */}
      <ChatInterface
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSendQuery={handleChatQuery}
      />
    </div>
  );
}