'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo, { LogoMark } from '../../components/Logo';
import ThemeToggle, { PaletteToggle } from '../../components/ThemeToggle';
import Icon from '../../components/Icon';

/**
 * Sign-in screen. Authentication isn't wired up yet, so every path leads
 * straight into the workspace — the page says so rather than pretending.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const enter = (e?: React.FormEvent) => {
    e?.preventDefault();
    router.push('/app');
  };

  return (
    <div className="grid min-h-screen bg-bg text-ink lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="DealCortex home">
            <Logo />
          </Link>
          <div className="flex gap-1.5">
            <PaletteToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12 animate-fade-in-up">
          <h1 className="font-display text-3xl font-medium">Sign in</h1>
          <p className="mt-2 text-sm text-ink-2">Welcome back. Pick up your pipeline where you left it.</p>

          <div className="mt-6 flex items-start gap-2.5 rounded-md border border-line bg-sunken/70 p-3 text-[13px] text-ink-2">
            <Icon name="alert" className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-3" />
            <span>Accounts aren&rsquo;t switched on yet — any button below takes you straight to the workspace.</span>
          </div>

          <form onSubmit={enter} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink">Work email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="mt-1.5 h-11 w-full rounded-md border border-line-strong bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus-visible:outline-none"
              />
            </label>
            <label className="block">
              <span className="flex items-center justify-between text-sm font-medium text-ink">
                Password
                <span className="text-[12px] font-normal text-ink-3">Forgot it?</span>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="mt-1.5 h-11 w-full rounded-md border border-line-strong bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus-visible:outline-none"
              />
            </label>
            <button
              type="submit"
              className="h-11 w-full rounded-md bg-ink text-sm font-semibold text-bg transition-opacity hover:opacity-90"
            >
              Sign in
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[12px] text-ink-3">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>

          <button
            onClick={() => enter()}
            className="h-11 w-full rounded-md border border-line-strong bg-surface text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            Continue as guest
          </button>

          <p className="mt-8 text-center text-[13px] text-ink-3">
            New here?{' '}
            <Link href="/" className="font-medium text-coral-ink hover:underline">
              See what DealCortex does
            </Link>
          </p>
        </div>
      </div>

      {/* Brand side */}
      <div className="relative hidden overflow-hidden bg-ink text-bg lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="chart-grid absolute inset-0 opacity-20" aria-hidden />
        <LogoMark size={64} className="relative" animated />
        <div className="relative max-w-md">
          <p className="font-display text-3xl font-medium leading-snug">
            Find out a deal is slipping before the forecast call — not during it.
          </p>
          <p className="mt-4 text-sm opacity-60">One question, five sources, a report you can share.</p>
        </div>
        <div className="relative grid grid-cols-3 gap-6 border-t border-bg/15 pt-6 text-sm">
          {[
            ['5', 'sources read together'],
            ['6', 'agents per question'],
            ['PDF · PPTX', 'ready to share'],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="font-display text-xl">{v}</div>
              <div className="mt-1 opacity-60">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
