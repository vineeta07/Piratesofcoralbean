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
import ThemeToggle from './ThemeToggle';
import Logo, { LogoMark } from './Logo';
import Icon, { IconName } from './Icon';
import { analyzeQuery } from '../lib/api';
import { ApiResponse } from '../lib/types';

/* ───────────────────────── Static content ───────────────────────── */

const DATA_SOURCES: { icon: IconName; name: string; reads: string; desc: string }[] = [
  { icon: 'cloud', name: 'Salesforce', reads: 'Pipeline', desc: 'Stages, deal values, owners, close dates and CRM activity.' },
  { icon: 'mail', name: 'Gmail', reads: 'Threads', desc: 'Silence since last reply, thread length, legal flags.' },
  { icon: 'mic', name: 'Gong', reads: 'Calls', desc: 'Call sentiment, objection counts, economic buyer attendance.' },
  { icon: 'chat', name: 'Slack', reads: 'Channels', desc: 'Competitor mentions, escalations, internal team mood.' },
  { icon: 'briefcase', name: 'LinkedIn', reads: 'People', desc: 'Champion job changes, hiring freezes, role moves.' },
];

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: 'pulse',
    title: 'Risk scoring you can audit',
    desc: 'Every deal gets a 0–100 score with each deduction listed next to the source it came from. No black box.',
  },
  {
    icon: 'search',
    title: 'Plain-English questions',
    desc: 'Ask “which deals closing this month went quiet?” and the agents work out intent, timeframe and which sources to read.',
  },
  {
    icon: 'chat',
    title: 'Slack-ready digest',
    desc: 'A pipeline summary formatted for your team channel, ordered by risk, with a next step for each deal.',
  },
  {
    icon: 'layers',
    title: 'See the working',
    desc: 'Watch each agent run, inspect the parsed intent and read the exact Coral SQL that was generated.',
  },
  {
    icon: 'doc',
    title: 'Brief and deck, generated',
    desc: 'An executive DOCX brief and a PPTX deck are produced from the same analysis, ready to download.',
  },
];

const PIPELINE_STEPS = [
  { num: '01', title: 'Parse', desc: 'Read the question for intent, timeframe and urgency.' },
  { num: '02', title: 'Chart a course', desc: 'Pick which of the five sources are worth querying.' },
  { num: '03', title: 'Sound the depths', desc: 'Run Coral SQL across sources and score every deal.' },
  { num: '04', title: 'Report', desc: 'Return risk cards, narratives, a Slack digest and documents.' },
];

const TRY_QUERIES = [
  'Show me all deals at risk',
  'Which deals closing this month have gone silent?',
  'Deals where champion changed jobs',
  'Competitor mentions in Slack this week',
];

const SAMPLE_LOG = [
  { name: 'Northwind Logistics', value: '$240K', score: 38, level: 'red' as const, note: 'Champion silent 14 days' },
  { name: 'Halcyon Health', value: '$185K', score: 61, level: 'amber' as const, note: 'Competitor named on Gong call' },
  { name: 'Brightwater Retail', value: '$92K', score: 84, level: 'green' as const, note: 'EB attended last two calls' },
];

const LEVEL_STYLES = {
  red: { text: 'text-risk-red', bar: 'bg-risk-red', label: 'At risk' },
  amber: { text: 'text-risk-amber', bar: 'bg-risk-amber', label: 'Watch' },
  green: { text: 'text-risk-green', bar: 'bg-risk-green', label: 'On course' },
};

/* ───────────────────────── Small pieces ───────────────────────── */

function SectionHeading({ eyebrow, title, desc }: { eyebrow: string; title: React.ReactNode; desc?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      <div className="eyebrow mb-3">{eyebrow}</div>
      <h2 className="font-display text-3xl font-medium leading-tight text-ink md:text-[2.5rem]">{title}</h2>
      {desc && <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{desc}</p>}
    </div>
  );
}

function SampleLogCard() {
  return (
    <div className="rounded-lg border border-line bg-surface shadow-[0_1px_0_rgb(var(--line)),0_12px_32px_-16px_rgb(var(--ink)/0.18)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Icon name="compass" className="h-4 w-4 text-ink-3" />
          <span className="font-display text-[15px] font-medium">Captain&rsquo;s log</span>
        </div>
        <span className="eyebrow">Example output</span>
      </div>
      <ul className="divide-y divide-line">
        {SAMPLE_LOG.map((d) => {
          const s = LEVEL_STYLES[d.level];
          return (
            <li key={d.name} className="px-5 py-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="truncate text-[15px] font-semibold text-ink">{d.name}</span>
                <span className="font-mono text-sm text-ink-2">{d.value}</span>
              </div>
              <div className="mt-2.5 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                  <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${d.score}%` }} />
                </div>
                <span className={`w-16 text-right font-mono text-xs ${s.text}`}>{d.score}/100</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[13px]">
                <span className="text-ink-2">{d.note}</span>
                <span className={`font-medium ${s.text}`}>{s.label}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between border-t border-line bg-sunken/60 px-5 py-3 text-[12px] text-ink-3">
        <span>Read from Salesforce, Gmail, Gong, Slack, LinkedIn</span>
        <span className="font-mono">3 deals</span>
      </div>
    </div>
  );
}

/* ───────────────────────── Main component ───────────────────────── */

export default function PipelineDashboard() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showTracer, setShowTracer] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const queryInputRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async (q: string) => {
    setIsLoading(true);
    setShowTracer(true);
    setError(null);
    try {
      const result = await analyzeQuery(q);
      if (!result.success) {
        throw new Error(result.error || 'Backend pipeline failed to analyze deals.');
      }
      setData(result);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze deals. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatQuery = useCallback(async (q: string): Promise<ApiResponse> => {
    const result = await analyzeQuery(q);
    setData(result);
    return result;
  }, []);

  const showLanding = !data && !showTracer;

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* ═══════════ Header ═══════════ */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="rounded-md" aria-label="Coral Bean home">
            <Logo />
          </a>
          <nav className="flex items-center gap-1 sm:gap-2">
            {showLanding && (
              <div className="mr-2 hidden items-center gap-6 text-sm text-ink-2 md:flex">
                <a href="#how" className="hover:text-ink">How it works</a>
                <a href="#sources" className="hover:text-ink">Sources</a>
              </div>
            )}
            <ThemeToggle />
            <button
              onClick={() => setIsChatOpen(true)}
              className="ml-1 hidden h-9 items-center gap-2 rounded-md bg-ink px-3.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 sm:inline-flex"
            >
              <Icon name="chat" className="h-4 w-4" />
              Ask Coral
            </button>
          </nav>
        </div>
      </header>

      {/* ═══════════ Hero ═══════════ */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="chart-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-14 sm:px-6 md:pt-20 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="eyebrow mb-5 flex items-center gap-2">
              <span className="inline-block h-px w-6 bg-coral" />
              Pipeline risk, read from five sources
            </div>
            <h1 className="font-display text-[2.6rem] font-medium leading-[1.05] text-ink sm:text-5xl md:text-[3.75rem]">
              Know which deals are drifting <em className="font-normal italic text-coral-ink">before</em> they sink.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
              Ask a question in plain English. Coral Bean reads your CRM, inbox, call recordings, Slack and LinkedIn
              together, scores every deal, and tells you what to do next.
            </p>

            <div className="mt-8" ref={queryInputRef}>
              <QueryInput query={query} setQuery={setQuery} onAnalyze={handleAnalyze} isLoading={isLoading} />
            </div>

            {showLanding && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[13px] text-ink-3">Try</span>
                {TRY_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuery(q)}
                    disabled={isLoading}
                    className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <dl className="mt-10 grid max-w-lg grid-cols-3 divide-x divide-line border-y border-line">
              {[
                { value: '5', label: 'Sources' },
                { value: '6', label: 'Agents' },
                { value: 'Brief + deck', label: 'Outputs' },
              ].map((stat) => (
                <div key={stat.label} className="px-4 py-3 first:pl-0">
                  <dt className="eyebrow">{stat.label}</dt>
                  <dd className="mt-1 whitespace-nowrap font-display text-lg font-medium text-ink sm:text-xl">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-5 lg:pt-6">
            <SampleLogCard />
          </div>
        </div>
      </section>

      {/* ═══════════ Results ═══════════ */}
      <div ref={resultsRef} className="mx-auto max-w-6xl scroll-mt-20 px-4 sm:px-6">
        {error && (
          <div className="mt-10 flex items-start gap-3 rounded-lg border border-risk-red/30 bg-risk-red/[0.06] p-4 text-sm text-risk-red animate-fade-in">
            <Icon name="alert" className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {showTracer && (
          <div className="mt-10 grid gap-6 lg:grid-cols-12">
            <div className="animate-fade-in lg:col-span-5">
              <AgentTracer isRunning={isLoading} />
            </div>
            {data?.query_inspection && (
              <div className="animate-fade-in-up lg:col-span-7">
                <QueryInspector inspection={data.query_inspection} />
              </div>
            )}
          </div>
        )}

        {data && data.dashboard && (
          <div className="grid grid-cols-1 gap-12 py-14 animate-fade-in-up lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <div className="mb-6 flex items-end justify-between border-b border-line pb-3">
                <h2 className="font-display text-2xl font-medium">Pipeline</h2>
                <span className="eyebrow">Sorted by risk</span>
              </div>
              <SummaryStats summary={data.dashboard.summary} />
              <DealsList deals={data.dashboard.deals} />
            </div>
            <div className="lg:col-span-5">
              <div className="mb-6 flex items-end justify-between border-b border-line pb-3">
                <h2 className="font-display text-2xl font-medium">Outputs</h2>
                <span className="eyebrow">Share &amp; export</span>
              </div>
              <SlackDigest slack={data.slack} />
              <div className="mt-6">
                <OutputPanel data={data} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ Landing sections ═══════════ */}
      {showLanding && (
        <>
          {/* What it does */}
          <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
            <SectionHeading
              eyebrow="What you get"
              title="A clear read on every deal, not another dashboard to babysit."
              desc="Built for sales leaders who need to know where to spend this week — and why."
            />
            <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-surface p-6">
                  <Icon name={f.icon} className="h-5 w-5 text-coral" />
                  <h3 className="mt-4 text-[16px] font-semibold text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{f.desc}</p>
                </div>
              ))}
              <div className="flex flex-col justify-between bg-sunken p-6">
                <p className="font-display text-xl leading-snug text-ink">
                  &ldquo;Which of my late-stage deals have gone quiet?&rdquo;
                </p>
                <button
                  onClick={() => {
                    setQuery('Which late stage deals have gone quiet?');
                    queryInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="mt-6 inline-flex items-center gap-2 self-start text-sm font-medium text-coral-ink hover:underline"
                >
                  Ask it <Icon name="arrowRight" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section id="how" className="scroll-mt-20 border-y border-line bg-surface">
            <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
              <SectionHeading
                eyebrow="How it works"
                title="Six agents, one voyage, a few seconds."
                desc="Each question runs through the same four legs. You can watch every one of them."
              />
              <ol className="grid gap-8 md:grid-cols-4 md:gap-6">
                {PIPELINE_STEPS.map((step) => (
                  <li key={step.num} className="border-t-2 border-ink pt-4">
                    <span className="font-mono text-sm text-coral-ink">{step.num}</span>
                    <h3 className="mt-2 font-display text-xl font-medium text-ink">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-2">{step.desc}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Sources */}
          <section id="sources" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 md:py-24">
            <SectionHeading
              eyebrow="Sources"
              title="Five tools your team already uses, read as one."
              desc="Coral SQL queries them through a single interface — there are no integrations for you to build."
            />
            <div className="overflow-hidden rounded-lg border border-line bg-surface">
              {DATA_SOURCES.map((src, i) => (
                <div
                  key={src.name}
                  className={`grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 px-5 py-4 sm:grid-cols-[auto_10rem_7rem_1fr] ${
                    i > 0 ? 'border-t border-line' : ''
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-bg text-ink-2">
                    <Icon name={src.icon} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="font-semibold text-ink">{src.name}</span>
                  <span className="eyebrow col-start-2 sm:col-start-auto">{src.reads}</span>
                  <span className="col-start-2 text-sm text-ink-2 sm:col-start-auto">{src.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
            <div className="flex flex-col items-start justify-between gap-8 rounded-lg bg-ink px-8 py-10 text-bg md:flex-row md:items-center md:px-12">
              <div className="flex items-center gap-5">
                <LogoMark size={52} className="hidden flex-shrink-0 sm:block" />
                <div>
                  <h2 className="font-display text-2xl font-medium md:text-3xl">Ready to check the hull?</h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed opacity-75">
                    Type a question at the top, or open the chat for a back-and-forth with Coral.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => queryInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="inline-flex items-center gap-2 rounded-md bg-coral px-5 py-2.5 text-sm font-semibold text-white dark:text-bg transition-opacity hover:opacity-90"
                >
                  Ask a question
                </button>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="inline-flex items-center gap-2 rounded-md border border-bg/30 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-bg/10"
                >
                  Open chat
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ═══════════ Footer ═══════════ */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <LogoMark size={26} className="text-ink" />
            <span className="text-sm font-medium text-ink">Pirates of Coral Bean</span>
            <span className="text-xs text-ink-3">Hackathon build</span>
          </div>
          <p className="font-mono text-xs text-ink-3">Next.js · FastAPI · CrewAI · Groq · Coral SQL</p>
        </div>
      </footer>

      {/* ═══════════ Floating chat button ═══════════ */}
      <button
        onClick={() => setIsChatOpen(true)}
        className={`fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-ink pl-4 pr-5 text-sm font-medium text-bg shadow-[0_8px_24px_-8px_rgb(0_0_0/0.35)] transition-all duration-200 hover:-translate-y-0.5 ${
          isChatOpen ? 'pointer-events-none translate-y-2 opacity-0' : 'opacity-100'
        }`}
        aria-label="Open chat"
      >
        <Icon name="chat" className="h-[18px] w-[18px]" />
        Ask Coral
      </button>

      <ChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onSendQuery={handleChatQuery} />
    </div>
  );
}
