'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Logo, { LogoMark } from '../Logo';
import Icon, { IconName } from '../Icon';
import ThemeToggle, { PaletteToggle } from '../ThemeToggle';

/* ───────────────────────── Content ───────────────────────── */

const SOURCES: { icon: IconName; name: string; reads: string; desc: string }[] = [
  { icon: 'cloud', name: 'Salesforce', reads: 'Pipeline', desc: 'Stages, values, owners, close dates and CRM activity.' },
  { icon: 'mail', name: 'Gmail', reads: 'Threads', desc: 'Silence since last reply, thread length, legal flags.' },
  { icon: 'mic', name: 'Gong', reads: 'Calls', desc: 'Call sentiment, objections, economic buyer attendance.' },
  { icon: 'chat', name: 'Slack', reads: 'Channels', desc: 'Competitor mentions, escalations, team mood.' },
  { icon: 'briefcase', name: 'LinkedIn', reads: 'People', desc: 'Champion job changes, hiring freezes, role moves.' },
];

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'pulse', title: 'Scores you can audit', desc: 'Every deal gets a 0–100 score, with each deduction listed next to the source it came from.' },
  { icon: 'search', title: 'Plain-English questions', desc: 'Ask “which deals closing this month went quiet?” — no filters, no SQL, no dashboards to build.' },
  { icon: 'arrowRight', title: 'A next step for every deal', desc: 'Not just a red flag: a concrete action for the rep, written from the signals.' },
  { icon: 'chat', title: 'Slack-ready digest', desc: 'A summary ordered by risk, ready to paste into your team channel.' },
];

const STEPS = [
  { num: '01', title: 'Ask', desc: 'Type a question in plain English.' },
  { num: '02', title: 'Read', desc: 'Agents pick the right sources and query them together.' },
  { num: '03', title: 'Score', desc: 'Every deal is scored and explained, signal by signal.' },
  { num: '04', title: 'Share', desc: 'Download a PDF or deck, or post the Slack digest.' },
];

const DEMOS = [
  {
    q: 'Which deals closing this month have gone silent?',
    rows: [
      { name: 'Northwind Logistics', value: '$240K', score: 38, level: 'red', note: 'No reply in 14 days' },
      { name: 'Halcyon Health', value: '$185K', score: 57, level: 'amber', note: 'Champion out of office' },
      { name: 'Brightwater Retail', value: '$92K', score: 81, level: 'green', note: 'Replied yesterday' },
    ],
  },
  {
    q: 'Deals where the champion changed jobs',
    rows: [
      { name: 'Kestrel Systems', value: '$310K', score: 34, level: 'red', note: 'Champion joined a competitor' },
      { name: 'Oakline Partners', value: '$120K', score: 63, level: 'amber', note: 'New VP, not yet met' },
      { name: 'Meridian Labs', value: '$76K', score: 79, level: 'green', note: 'Backup champion engaged' },
    ],
  },
  {
    q: 'Competitor mentions in Slack this week',
    rows: [
      { name: 'Harbor & Pine', value: '$205K', score: 41, level: 'red', note: 'Competitor in final round' },
      { name: 'Lumen Freight', value: '$140K', score: 66, level: 'amber', note: 'Price comparison requested' },
      { name: 'Saltmarsh Co.', value: '$58K', score: 88, level: 'green', note: 'No competitor named' },
    ],
  },
];

const LEVEL: Record<string, { bar: string; text: string; label: string }> = {
  red: { bar: 'bg-risk-red', text: 'text-risk-red', label: 'At risk' },
  amber: { bar: 'bg-risk-amber', text: 'text-risk-amber', label: 'Watch' },
  green: { bar: 'bg-risk-green', text: 'text-risk-green', label: 'On course' },
};

/* ───────────────────────── Motion helpers ───────────────────────── */

/** Fades children up when they scroll into view. */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/** Splits a line into words that rise in one after another. */
function RiseWords({ text, start = 0 }: { text: string; start?: number }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <span className="inline-block animate-rise" style={{ animationDelay: `${start + i * 70}ms` }}>
            {w}&nbsp;
          </span>
        </span>
      ))}
    </>
  );
}

/** Types out each demo question, shows its results, then moves on. */
function useDemoLoop() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<'typing' | 'thinking' | 'results'>('typing');

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const q = DEMOS[index].q;
    let timer: ReturnType<typeof setTimeout>;
    if (reduce) {
      setTyped(q);
      setPhase('results');
      return;
    }
    if (phase === 'typing') {
      if (typed.length < q.length) timer = setTimeout(() => setTyped(q.slice(0, typed.length + 1)), 38);
      else timer = setTimeout(() => setPhase('thinking'), 400);
    } else if (phase === 'thinking') {
      timer = setTimeout(() => setPhase('results'), 900);
    } else {
      timer = setTimeout(() => {
        setIndex((i) => (i + 1) % DEMOS.length);
        setTyped('');
        setPhase('typing');
      }, 4200);
    }
    return () => clearTimeout(timer);
  }, [index, typed, phase]);

  return { demo: DEMOS[index], typed, phase, index };
}

/* ───────────────────────── Pieces ───────────────────────── */

function DemoWindow() {
  const { demo, typed, phase, index } = useDemoLoop();
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_0_rgb(var(--line)),0_30px_60px_-30px_rgb(var(--ink)/0.35)]">
      {/* window chrome */}
      <div className="flex items-center gap-3 border-b border-line bg-sunken/60 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        </div>
        <span className="font-mono text-[11px] text-ink-3">dealcortex / ask</span>
      </div>

      <div className="flex">
        {/* mini sidebar */}
        <div className="hidden w-36 flex-shrink-0 border-r border-line p-3 sm:block">
          <div className="mb-3 h-7 rounded bg-coral/90" />
          {['Ask', 'Pipeline', 'Reports', 'History'].map((l, i) => (
            <div key={l} className={`mb-1 rounded px-2 py-1.5 text-[11px] ${i === 0 ? 'bg-sunken font-semibold text-ink' : 'text-ink-3'}`}>
              {l}
            </div>
          ))}
        </div>

        <div className="min-h-[300px] min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-center gap-2 rounded-md border border-line-strong bg-bg px-3 py-2.5">
            <Icon name="search" className="h-3.5 w-3.5 flex-shrink-0 text-ink-3" />
            <span className={`min-w-0 truncate text-[13px] text-ink ${phase === 'typing' ? 'caret' : ''}`}>{typed}</span>
          </div>

          {phase === 'thinking' && (
            <div className="mt-6 flex items-center gap-2 text-[12px] text-ink-3 animate-fade-in">
              <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
              Reading Salesforce, Gmail, Gong, Slack, LinkedIn…
            </div>
          )}

          {phase === 'results' && (
            <div key={index} className="mt-4">
              <div className="mb-2 flex gap-1.5">
                {demo.rows.map((r, i) => (
                  <span
                    key={r.name}
                    className={`h-1 flex-1 origin-left rounded-full ${LEVEL[r.level].bar} animate-grow`}
                    style={{ animationDelay: `${i * 90}ms` }}
                  />
                ))}
              </div>
              <ul className="divide-y divide-line rounded-md border border-line">
                {demo.rows.map((r, i) => (
                  <li
                    key={r.name}
                    className="relative px-3 py-2.5 animate-fade-in-up"
                    style={{ animationDelay: `${120 + i * 140}ms` }}
                  >
                    <span className={`absolute inset-y-0 left-0 w-0.5 ${LEVEL[r.level].bar}`} />
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[13px] font-semibold text-ink">{r.name}</span>
                      <span className="font-mono text-[11px] text-ink-2">{r.value}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-sunken">
                        <div
                          className={`h-full origin-left rounded-full ${LEVEL[r.level].bar} animate-grow`}
                          style={{ width: `${r.score}%`, animationDelay: `${250 + i * 140}ms` }}
                        />
                      </div>
                      <span className={`w-16 whitespace-nowrap text-right text-[11px] font-medium ${LEVEL[r.level].text}`}>{LEVEL[r.level].label}</span>
                    </div>
                    <div className="mt-1 text-[11.5px] text-ink-3">{r.note}</div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2 animate-fade-in" style={{ animationDelay: '700ms' }}>
                <span className="inline-flex items-center gap-1 rounded bg-ink px-2 py-1 text-[10.5px] font-medium text-bg">
                  <Icon name="doc" className="h-3 w-3" /> PDF
                </span>
                <span className="inline-flex items-center gap-1 rounded border border-line-strong px-2 py-1 text-[10.5px] font-medium text-ink">
                  <Icon name="slides" className="h-3 w-3" /> PowerPoint
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, desc }: { eyebrow: string; title: React.ReactNode; desc?: string }) {
  return (
    <Reveal className="mb-12 max-w-2xl">
      <div className="eyebrow mb-3">{eyebrow}</div>
      <h2 className="font-display text-3xl font-medium leading-tight text-ink md:text-[2.5rem]">{title}</h2>
      {desc && <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{desc}</p>}
    </Reveal>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg text-ink">
      {/* Header */}
      <header
        className={`sticky top-0 z-30 border-b transition-colors duration-300 ${
          scrolled ? 'border-line bg-bg/95 backdrop-blur-sm' : 'border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="DealCortex home">
            <Logo animated />
          </Link>
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <div className="mr-3 hidden items-center gap-6 text-sm text-ink-2 md:flex">
              <a href="#features" className="hover:text-ink">Features</a>
              <a href="#exports" className="hover:text-ink">Reports</a>
              <a href="#sources" className="hover:text-ink">Sources</a>
            </div>
            <PaletteToggle />
            <ThemeToggle />
            <Link href="/login" className="ml-1 hidden h-9 items-center px-3 text-sm font-medium text-ink-2 hover:text-ink sm:inline-flex">
              Sign in
            </Link>
            <Link
              href="/app"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-ink px-3.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
            >
              Open app <Icon name="arrowRight" className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative -mt-16 pt-16">
        <div className="chart-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 md:pt-20 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <div className="eyebrow mb-5 flex items-center gap-2 animate-fade-in">
              <span className="inline-block h-px w-6 origin-left bg-coral animate-grow" />
              Deal intelligence for sales leaders
            </div>
            <h1 className="font-display text-[2.6rem] font-medium leading-[1.06] text-ink sm:text-5xl md:text-[3.6rem]">
              <RiseWords text="Know which deals are drifting" />
              <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <em className="inline-block animate-rise font-normal italic text-coral-ink" style={{ animationDelay: '360ms' }}>
                  before&nbsp;
                </em>
              </span>
              <RiseWords text="they sink." start={430} />
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink-2 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
              DealCortex reads your CRM, inbox, call recordings, Slack and LinkedIn together, scores every deal, and tells
              you what to do next — then hands you the report.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: '750ms' }}>
              <Link
                href="/app"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-coral px-6 text-[15px] font-semibold text-white transition-transform hover:-translate-y-0.5 dark:text-bg"
              >
                Open the workspace <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2} />
              </Link>
              <a
                href="#how"
                className="inline-flex h-12 items-center rounded-md border border-line-strong bg-surface px-6 text-[15px] font-medium text-ink transition-colors hover:border-ink"
              >
                How it works
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-ink-3 animate-fade-in" style={{ animationDelay: '900ms' }}>
              <span className="text-[12px]">Reads from</span>
              {SOURCES.map((s) => (
                <span key={s.name} className="inline-flex items-center gap-1.5 text-[13px]">
                  <Icon name={s.icon} className="h-3.5 w-3.5" />
                  {s.name}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <DemoWindow />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <SectionHeading
            eyebrow="What you get"
            title="A clear read on every deal, not another dashboard to babysit."
            desc="Built for the Monday pipeline review: where to spend this week, and why."
          />
          <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 90} className="bg-surface">
                <div className="group h-full p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-bg text-coral transition-transform duration-300 group-hover:-translate-y-0.5">
                    <Icon name={f.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-[16px] font-semibold text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Exports */}
      <section id="exports" className="scroll-mt-20 border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Reports"
              title="Walk into the meeting with the deck already made."
              desc="Every answer can be downloaded as a formatted PDF report or an editable PowerPoint deck — summary, one slide per deal, and the action list."
            />
            <Reveal delay={100}>
              <ul className="space-y-3 text-[15px] text-ink-2">
                {['PDF report for leadership and email', 'PowerPoint deck you can edit before the review', 'Slack digest to paste into your channel'].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-bg">
                      <Icon name="check" className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={150}>
            <div className="relative mx-auto h-[320px] max-w-md">
              {/* Deck */}
              <div className="absolute right-0 top-6 w-[78%] rotate-[3deg] rounded-md bg-ink p-5 text-bg shadow-[0_24px_50px_-24px_rgb(0_0_0/0.5)] transition-transform duration-500 hover:rotate-[1deg]">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-coral">Pipeline review</div>
                <div className="mt-3 font-display text-lg leading-snug">Deals that went quiet this month</div>
                <div className="mt-8 h-0.5 w-full bg-coral" />
                <div className="mt-2 flex justify-between font-mono text-[9px] opacity-60">
                  <span>PPTX</span>
                  <span>14 slides</span>
                </div>
              </div>
              {/* PDF */}
              <div className="absolute bottom-0 left-0 w-[58%] -rotate-[4deg] overflow-hidden rounded-md border border-line-strong bg-bg shadow-[0_24px_50px_-24px_rgb(0_0_0/0.45)] transition-transform duration-500 hover:-rotate-[2deg]">
                <div className="bg-ink px-4 py-3">
                  <div className="font-display text-[13px] text-bg">Pipeline risk report</div>
                </div>
                <div className="h-0.5 bg-coral" />
                <div className="grid grid-cols-4 gap-1.5 p-3">
                  {[
                    ['12', 'text-ink'],
                    ['3', 'text-risk-red'],
                    ['4', 'text-risk-amber'],
                    ['5', 'text-risk-green'],
                  ].map(([n, c], i) => (
                    <div key={i} className="rounded-sm border border-line bg-surface px-1.5 py-1">
                      <div className={`font-display text-sm ${c}`}>{n}</div>
                    </div>
                  ))}
                </div>
                {['bg-risk-red', 'bg-risk-amber', 'bg-risk-green'].map((c) => (
                  <div key={c} className="mx-3 mb-2.5 flex gap-2">
                    <span className={`w-0.5 ${c}`} />
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 w-2/3 rounded-sm bg-ink/70" />
                      <div className="h-1 w-full rounded-sm bg-line-strong" />
                      <div className="h-1 w-4/5 rounded-sm bg-line-strong" />
                    </div>
                  </div>
                ))}
                <div className="px-3 pb-3 font-mono text-[9px] text-ink-3">PDF · 3 pages</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 md:py-28">
        <SectionHeading eyebrow="How it works" title="Four steps, a few seconds." />
        <ol className="grid gap-8 md:grid-cols-4 md:gap-6">
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delay={i * 120}>
              <li className="list-none">
                <div className="h-0.5 w-full bg-line">
                  <div className="h-full w-full origin-left bg-ink" />
                </div>
                <span className="mt-4 block font-mono text-sm text-coral-ink">{step.num}</span>
                <h3 className="mt-2 font-display text-2xl font-medium text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{step.desc}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Sources */}
      <section id="sources" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <SectionHeading
            eyebrow="Sources"
            title="Five tools your team already uses, read as one."
            desc="Coral SQL queries them through a single interface — there are no integrations for you to build."
          />
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            {SOURCES.map((src, i) => (
              <Reveal key={src.name} delay={i * 70}>
                <div
                  className={`grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-sunken/50 sm:grid-cols-[auto_10rem_7rem_1fr] ${
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-8 rounded-xl bg-ink px-8 py-12 text-bg md:flex-row md:items-center md:px-12">
            <div className="flex items-center gap-5">
              <LogoMark size={56} className="hidden flex-shrink-0 sm:block" />
              <div>
                <h2 className="font-display text-3xl font-medium">Ready to check the hull?</h2>
                <p className="mt-2 max-w-md text-[15px] opacity-75">Open the workspace and ask your first question. No setup needed.</p>
              </div>
            </div>
            <Link
              href="/app"
              className="inline-flex h-12 items-center gap-2 rounded-md bg-coral px-6 text-[15px] font-semibold text-white transition-transform hover:-translate-y-0.5 dark:text-bg"
            >
              Open the workspace <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <LogoMark size={26} className="text-ink" />
            <span className="text-sm font-medium text-ink">DealCortex</span>
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-ink-3">
            <Link href="/app" className="hover:text-ink">Workspace</Link>
            <Link href="/login" className="hover:text-ink">Sign in</Link>
            <span className="font-mono text-xs">Next.js · FastAPI · CrewAI · Coral SQL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
