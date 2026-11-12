'use client';

import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogoMark } from '../Logo';

const DONE_KEY = 'coralbean.tour.done';
export const TOUR_EVENT = 'coralbean:tour';

/** Start the guided tour from anywhere in the workspace. */
export const startTour = () => window.dispatchEvent(new Event(TOUR_EVENT));

interface Step {
  target?: string; // matches [data-tour="..."]
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    title: 'Welcome aboard',
    body: 'A quick look around the workspace — about thirty seconds. You can skip at any time and replay it from Settings.',
  },
  {
    target: 'ask',
    title: 'Ask in plain English',
    body: 'Type a question about your pipeline, or pick one of the starters below. Coral Bean reads all five sources and scores every deal.',
  },
  {
    target: 'new',
    title: 'Start fresh any time',
    body: 'Your last answer stays on screen. Use New question to start another.',
  },
  {
    target: 'nav-pipeline',
    title: 'Your pipeline',
    body: 'Every deal from the latest answer in one table — filter by risk and open any deal for its signals and next step.',
  },
  {
    target: 'nav-reports',
    title: 'Reports for the meeting',
    body: 'Download a PDF report or an editable PowerPoint deck, and copy a Slack digest for your team channel.',
  },
  {
    target: 'nav-history',
    title: 'Pick up where you left off',
    body: 'Past questions are saved in this browser so you can reopen or re-export them.',
  },
  {
    target: 'appearance',
    title: 'Light, dark, or black & white',
    body: 'Switch between light and dark, or turn on the black & white palette.',
  },
];

function findTarget(name?: string): HTMLElement | null {
  if (!name) return null;
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  return els.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) ?? null;
}

export default function Tour() {
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const begin = useCallback(() => {
    if ((pathname || '').replace(/\/$/, '') !== '/app') router.push('/app?new=1');
    setStep(0);
  }, [pathname, router]);

  const finish = useCallback(() => {
    setStep(null);
    try {
      localStorage.setItem(DONE_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  // Listen for manual starts; auto-start once for first-time visitors.
  useEffect(() => {
    window.addEventListener(TOUR_EVENT, begin);
    let seen = true;
    try {
      seen = localStorage.getItem(DONE_KEY) === '1';
    } catch {
      /* ignore */
    }
    const t = !seen ? setTimeout(begin, 700) : undefined;
    return () => {
      window.removeEventListener(TOUR_EVENT, begin);
      if (t) clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track the highlighted element's position.
  useLayoutEffect(() => {
    if (step === null) return;
    const update = () => {
      const el = findTarget(STEPS[step].target);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
        setRect(el.getBoundingClientRect());
      } else setRect(null);
    };
    update();
    const id = setTimeout(update, 250); // after route change / layout settles
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      clearTimeout(id);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [step, pathname]);

  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight') setStep((s) => (s !== null && s < STEPS.length - 1 ? s + 1 : s));
      if (e.key === 'ArrowLeft') setStep((s) => (s ? s - 1 : s));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, finish]);

  if (step === null) return null;

  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  const pad = 6;

  // Place the card beside the highlight, or centred when there's nothing to point at.
  let cardStyle: React.CSSProperties = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  if (rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardW = Math.min(340, vw - 32);
    if (rect.right + 16 + cardW < vw && rect.width < vw / 2) {
      cardStyle = { left: rect.right + 16, top: Math.min(Math.max(16, rect.top - 8), vh - 240) };
    } else if (rect.bottom + 230 < vh) {
      cardStyle = { left: Math.min(Math.max(16, rect.left), vw - cardW - 16), top: rect.bottom + 14 };
    } else {
      cardStyle = { left: Math.min(Math.max(16, rect.left), vw - cardW - 16), top: Math.max(16, rect.top - 230) };
    }
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* Dimmer with a cut-out around the target */}
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-lg transition-all duration-300 ease-out"
          style={{
            left: rect.left - pad,
            top: rect.top - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: '0 0 0 2px rgb(var(--coral)), 0 0 0 9999px rgb(0 0 0 / 0.55)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/55 animate-fade-in" />
      )}
      <div className="absolute inset-0" onClick={finish} aria-hidden />

      <div
        className="absolute w-[min(340px,calc(100vw-32px))] rounded-lg border border-line bg-surface p-5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.5)] transition-all duration-300 ease-out"
        style={cardStyle}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-ink-3">
            {step + 1} / {STEPS.length}
          </span>
          <button onClick={finish} className="text-[12px] text-ink-3 hover:text-ink">
            Skip tour
          </button>
        </div>
        {step === 0 && <LogoMark size={40} className="mt-3 text-ink" />}
        <h2 id="tour-title" className="mt-3 font-display text-xl font-medium text-ink">
          {s.title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{s.body}</p>

        {/* Progress dots */}
        <div className="mt-4 flex gap-1">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-coral' : 'bg-sunken'}`} />
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="h-9 rounded-md border border-line px-3 text-sm text-ink-2 hover:text-ink"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (last ? finish() : setStep(step + 1))}
            className="h-9 rounded-md bg-ink px-4 text-sm font-medium text-bg hover:opacity-90"
            autoFocus
          >
            {last ? 'Get started' : step === 0 ? 'Show me around' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
