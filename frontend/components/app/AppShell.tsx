'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '../Logo';
import Icon, { IconName } from '../Icon';
import ThemeToggle, { PaletteToggle } from '../ThemeToggle';
import Tour, { startTour } from './Tour';
import { useAnalysis } from '../../lib/analysis';

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/app', label: 'Ask', icon: 'search' },
  { href: '/app/deals', label: 'Pipeline', icon: 'layers' },
  { href: '/app/reports', label: 'Reports', icon: 'doc' },
  { href: '/app/history', label: 'History', icon: 'history' },
  { href: '/app/settings', label: 'Settings', icon: 'sliders' },
];

const strip = (p: string) => (p.length > 1 ? p.replace(/\/$/, '') : p);

function isActive(pathname: string, href: string) {
  const p = strip(pathname);
  if (href === '/app') return p === '/app';
  if (href === '/app/deals') return p === '/app/deals' || p === '/app/deal';
  return p === href || p.startsWith(href + '/');
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() || '/app';
  const router = useRouter();
  const { history, current, open } = useAnalysis();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/" onClick={onNavigate} aria-label="DealCortex home">
          <Logo size={30} />
        </Link>
      </div>

      <div className="px-3 pb-2">
        <Link
          href="/app?new=1"
          onClick={onNavigate}
          data-tour="new"
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-coral text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:text-bg"
        >
          <Icon name="search" className="h-4 w-4" strokeWidth={2} />
          New question
        </Link>
      </div>

      <nav className="mt-2 space-y-0.5 px-3" aria-label="Workspace">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              data-tour={`nav-${item.label.toLowerCase()}`}
              className={`flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors ${
                active ? 'bg-sunken font-semibold text-ink' : 'text-ink-2 hover:bg-sunken/60 hover:text-ink'
              }`}
            >
              <Icon name={item.icon} className={`h-[17px] w-[17px] ${active ? 'text-coral' : ''}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {history.length > 0 && (
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-3">
          <div className="eyebrow px-3 pb-2">Recent</div>
          <ul className="space-y-0.5">
            {history.slice(0, 6).map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => {
                    open(h.id);
                    router.push('/app');
                    onNavigate?.();
                  }}
                  className={`w-full truncate rounded-md px-3 py-1.5 text-left text-[13px] transition-colors ${
                    current?.id === h.id ? 'text-ink' : 'text-ink-3 hover:bg-sunken/60 hover:text-ink'
                  }`}
                  title={h.query}
                >
                  {h.query}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {history.length === 0 && <div className="flex-1" />}

      <div className="px-3 pb-2">
        <button
          onClick={() => {
            onNavigate?.();
            startTour();
          }}
          className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-ink-3 transition-colors hover:bg-sunken/60 hover:text-ink"
        >
          <Icon name="compass" className="h-[17px] w-[17px]" />
          Take the tour
        </button>
      </div>

      <div className="flex items-center gap-2 border-t border-line p-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sunken font-display text-sm font-semibold text-ink-2">
          G
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-medium text-ink">Guest</div>
          <Link href="/login" onClick={onNavigate} className="text-[12px] text-ink-3 hover:text-coral-ink">
            Sign in
          </Link>
        </div>
        <div className="flex gap-1.5" data-tour="appearance">
          <PaletteToggle />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setDrawer(false), [pathname]);

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <button
          onClick={() => setDrawer(true)}
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-md text-ink-2 hover:bg-sunken"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <Link href="/" aria-label="DealCortex home">
          <Logo size={26} showTagline={false} />
        </Link>
        <div className="flex gap-1.5" data-tour="appearance">
          <PaletteToggle />
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-line bg-surface animate-slide-in">
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 lg:py-10">{children}</div>
      </main>

      <Tour />
    </div>
  );
}

/** Page title block used at the top of each workspace page. */
export function PageHeader({
  eyebrow,
  title,
  desc,
  actions,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  desc?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="font-display text-3xl font-medium leading-tight text-ink">{title}</h1>
        {desc && <p className="mt-2 max-w-2xl text-[15px] text-ink-2">{desc}</p>}
      </div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  );
}

/** Shown on pages that need an analysis when none has been run yet. */
export function NoAnalysis({ what }: { what: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
      <Icon name="compass" className="mx-auto h-7 w-7 text-ink-3" />
      <p className="mt-4 font-display text-xl text-ink">Nothing charted yet</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-2">Ask a question first and {what} will appear here.</p>
      <Link
        href="/app"
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-bg hover:opacity-90"
      >
        Ask a question <Icon name="arrowRight" className="h-4 w-4" />
      </Link>
    </div>
  );
}
