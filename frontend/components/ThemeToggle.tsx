'use client';

import React, { useEffect, useState } from 'react';
import Icon from './Icon';

export type ThemePref = 'light' | 'dark' | 'system';

const systemTheme = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export function readThemePref(): ThemePref {
  try {
    const t = localStorage.getItem('theme');
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

/** Apply a preference and remember it. 'system' follows the OS setting. */
export function applyThemePref(pref: ThemePref) {
  const resolved = pref === 'system' ? systemTheme() : pref;
  document.documentElement.setAttribute('data-theme', resolved);
  try {
    if (pref === 'system') localStorage.removeItem('theme');
    else localStorage.setItem('theme', pref);
  } catch {
    /* storage unavailable — theme still applies for this visit */
  }
  window.dispatchEvent(new CustomEvent('themechange', { detail: resolved }));
  return resolved;
}

export type Palette = 'coral' | 'mono';

export function readPalette(): Palette {
  try {
    return localStorage.getItem('palette') === 'mono' ? 'mono' : 'coral';
  } catch {
    return 'coral';
  }
}

/** Switch between the coral palette and the black & white one. */
export function applyPalette(p: Palette) {
  if (p === 'mono') document.documentElement.setAttribute('data-palette', 'mono');
  else document.documentElement.removeAttribute('data-palette');
  try {
    if (p === 'mono') localStorage.setItem('palette', 'mono');
    else localStorage.removeItem('palette');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('themechange'));
}

export function usePalette() {
  const [palette, setPalette] = useState<Palette | null>(null);
  useEffect(() => {
    const read = () => setPalette(document.documentElement.getAttribute('data-palette') === 'mono' ? 'mono' : 'coral');
    read();
    window.addEventListener('themechange', read);
    return () => window.removeEventListener('themechange', read);
  }, []);
  return palette;
}

/** Small button that flips the black & white palette on and off. */
export function PaletteToggle({ className = '' }: { className?: string }) {
  const palette = usePalette();
  const mono = palette === 'mono';
  const label = mono ? 'Turn off black & white' : 'Black & white mode';
  return (
    <button
      type="button"
      onClick={() => applyPalette(mono ? 'coral' : 'mono')}
      aria-label={label}
      aria-pressed={mono}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
        mono ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink'
      } ${className}`}
    >
      <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <circle cx="12" cy="12" r="8.25" />
        <path d="M12 3.75a8.25 8.25 0 0 1 0 16.5Z" fill="currentColor" />
      </svg>
    </button>
  );
}

export function useResolvedTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  useEffect(() => {
    const read = () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    read();
    window.addEventListener('themechange', read);
    return () => window.removeEventListener('themechange', read);
  }, []);
  return theme;
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useResolvedTheme();
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={() => applyThemePref(theme === 'dark' ? 'light' : 'dark')}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-ink-2 transition-colors hover:border-line-strong hover:text-ink ${className}`}
    >
      {theme && <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-[17px] w-[17px]" />}
    </button>
  );
}
