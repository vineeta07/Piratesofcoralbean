'use client';

import React, { useState, useCallback, useRef } from 'react';
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

/* ───────────────────── Static data for landing sections ──────────────────── */

const DATA_SOURCES = [
  {
    icon: '☁️',
    name: 'Salesforce',
    desc: 'Pipeline stages, deal values, owners, close dates, and CRM activity.',
    color: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/20',
    glow: 'shadow-blue-500/5',
  },
  {
    icon: '📧',
    name: 'Gmail',
    desc: 'Email silence detection, thread length, legal flags, and reply tracking.',
    color: 'from-red-500/20 to-orange-500/20',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/5',
  },
  {
    icon: '🎙️',
    name: 'Gong',
    desc: 'Call sentiment scores, objection counts, and economic buyer attendance.',
    color: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/20',
    glow: 'shadow-purple-500/5',
  },
  {
    icon: '💬',
    name: 'Slack',
    desc: 'Competitor mentions, escalation flags, and internal team sentiment.',
    color: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/5',
  },
  {
    icon: '💼',
    name: 'LinkedIn',
    desc: 'Champion job changes, hiring freezes, and contact role tracking.',
    color: 'from-sky-500/20 to-indigo-500/20',
    border: 'border-sky-500/20',
    glow: 'shadow-sky-500/5',
  },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
    title: 'AI-Powered Risk Scoring',
    desc: 'Multi-signal scoring engine analyzes email silence, call sentiment, champion changes, and more to classify deals as Red, Amber, or Green.',
    accent: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    title: 'Natural Language Queries',
    desc: 'Ask questions in plain English. Our AI agents parse your intent, select the right data sources, and build optimized SQL queries automatically.',
    accent: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    title: 'Slack-Ready Digests',
    desc: 'Get pipeline health reports formatted for Slack. Prioritized by risk level with actionable next steps your team can act on immediately.',
    accent: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
    title: 'Pipeline Transparency',
    desc: 'Watch the AI work in real-time. See which agents are running, what SQL was generated, and how each deal was scored — full transparency.',
    accent: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
];

const PIPELINE_STEPS = [
  { num: '01', title: 'Parse Intent', desc: 'AI understands what you\'re asking — intent, timeframe, urgency.' },
  { num: '02', title: 'Select Sources', desc: 'Picks the right data sources from Salesforce, Gmail, Gong, Slack, LinkedIn.' },
  { num: '03', title: 'Query & Score', desc: 'Generates Coral SQL, fetches data, and scores each deal for risk.' },
  { num: '04', title: 'Deliver Insights', desc: 'Returns a dashboard with risk cards, narratives, and Slack digests.' },
];

const SAMPLE_QUERIES = [
  { query: 'Show me all deals at risk', label: '🔴 Risk Scan' },
  { query: 'Which deals closing this month have gone silent?', label: '📧 Email Silence' },
  { query: 'Forecast revenue for this quarter', label: '📊 Forecast' },
  { query: 'Deals where champion changed jobs', label: '💼 Champion Risk' },
  { query: 'Show objections from Gong calls', label: '🎙️ Objections' },
  { query: 'Competitor mentions in Slack this week', label: '⚔️ Competitors' },
];

/* ──────────────────────────── Main Component ─────────────────────────────── */

export default function PipelineDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showTracer, setShowTracer] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async (query: string) => {
    setIsLoading(true);
    setShowTracer(true);
    setError(null);
    try {
      const result = await analyzeQuery(query);
      setData(result);
      // Scroll to results after a short delay
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
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

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-400">Powered by <span className="text-white font-semibold">Coral AI</span> + <span className="text-white font-semibold">6 Agents</span></span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-center tracking-tight mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
              Sales Deal
            </span>
            <br />
            <span className="text-white">Intelligence</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto text-center mb-10 leading-relaxed">
            Ask a question in plain English. Our AI agent pipeline cross-references 
            <span className="text-white font-medium"> 5 data sources </span> 
            to uncover the real health of every deal in your pipeline.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            {[
              { value: '5', label: 'Data Sources' },
              { value: '6', label: 'AI Agents' },
              { value: '< 3s', label: 'Analysis Time' },
              { value: '8', label: 'Risk Signals' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">{stat.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Query Input */}
          <div className="max-w-3xl mx-auto">
            <QueryInput onAnalyze={handleAnalyze} isLoading={isLoading} />
          </div>

          {/* Scroll hint */}
          {!data && !showTracer && (
            <div className="flex justify-center mt-8 animate-bounce">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════ RESULTS AREA ═══════════════════ */}
      <div ref={resultsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Agent Tracer */}
        {showTracer && (
          <div className="mb-8 animate-fade-in">
            <AgentTracer isRunning={isLoading} />
          </div>
        )}

        {/* Query Inspector */}
        {data && data.query_inspection && (
          <div className="mb-8 animate-fade-in-up">
            <QueryInspector inspection={data.query_inspection} />
          </div>
        )}

        {/* Main Results Grid */}
        {data && data.dashboard && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in-up pb-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-2 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Live Pipeline
              </h2>
              <SummaryStats summary={data.dashboard.summary} />
              <DealsList deals={data.dashboard.deals} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-2 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
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

      {/* ═══════════════ LANDING SECTIONS (hidden when results shown) ═══════════════ */}
      {!data && !showTracer && (
        <>
          {/* ─── Quick Start: Sample Queries ─── */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="text-center mb-8">
              <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-2">Quick Start</h2>
              <p className="text-gray-400 text-sm">Click any example to try it instantly</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
              {SAMPLE_QUERIES.map((sq) => (
                <button
                  key={sq.query}
                  onClick={() => handleAnalyze(sq.query)}
                  disabled={isLoading}
                  className="group text-left px-5 py-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300 disabled:opacity-40"
                >
                  <div className="text-xs text-gray-500 mb-1.5 font-medium">{sq.label}</div>
                  <div className="text-sm text-gray-300 group-hover:text-white transition-colors leading-snug">{sq.query}</div>
                </button>
              ))}
            </div>
          </section>

          {/* ─── Features Grid ─── */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">protect your pipeline</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                From risk detection to actionable insights — the full toolkit for modern sales leaders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className={`group rounded-2xl p-6 bg-white/[0.03] border ${f.border} hover:bg-white/[0.06] transition-all duration-300 hover:scale-[1.01]`}
                >
                  <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${f.bg} ${f.accent} mb-4`}>
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ─── How It Works ─── */}
          <section className="relative overflow-hidden pb-24">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.02] to-transparent pointer-events-none" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-14">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  How it <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">works</span>
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto">
                  A 4-step AI pipeline runs in under 3 seconds to deliver actionable deal intelligence.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {PIPELINE_STEPS.map((step, i) => (
                  <div key={step.num} className="relative group">
                    {/* Connector line */}
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] right-[-16px] h-px bg-gradient-to-r from-white/10 to-white/5 z-0" />
                    )}
                    <div className="relative z-10 rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-300 text-center h-full">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 mb-4">
                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{step.num}</span>
                      </div>
                      <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── Data Sources ─── */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Unified across <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">5 platforms</span>
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Coral SQL engine queries all your sales tools through a single interface — no integrations to build.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {DATA_SOURCES.map((src) => (
                <div
                  key={src.name}
                  className={`group rounded-2xl p-5 bg-gradient-to-br ${src.color} border ${src.border} hover:scale-105 transition-all duration-300 shadow-lg ${src.glow} text-center`}
                >
                  <div className="text-4xl mb-3">{src.icon}</div>
                  <h3 className="text-base font-semibold text-white mb-2">{src.name}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{src.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ─── CTA Section ─── */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 border border-white/10 p-10 md:p-14 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to see the truth behind your deals?
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto mb-8">
                Type a question above or click the chat button to start an interactive conversation with Coral AI.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-400 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                >
                  Try a Query ↑
                </button>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all duration-300"
                >
                  💬 Open Chat
                </button>
              </div>
            </div>
          </section>

          {/* ─── Footer ─── */}
          <footer className="border-t border-white/5 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏴‍☠️</span>
                <span className="text-sm font-semibold text-white">Pirates of Coral Bean</span>
                <span className="text-xs text-gray-600 ml-2">Hackathon 2024</span>
              </div>
              <p className="text-xs text-gray-600">
                Built with Next.js · FastAPI · CrewAI · Groq · Coral SQL
              </p>
            </div>
          </footer>
        </>
      )}

      {/* ═══════════════════ FLOATING CHAT BUTTON ═══════════════════ */}
      <button
        onClick={() => setIsChatOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-500/40 ${
          isChatOpen ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100'
        }`}
        aria-label="Open chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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