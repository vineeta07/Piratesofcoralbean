'use client';

import React, { useEffect, useState } from 'react';
import Icon from './Icon';

type Theme = 'light' | 'dark';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage unavailable — theme still applies for this visit */
    }
    setTheme(next);
  };

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
    >
      {/* Render nothing until mounted to avoid a wrong icon flash */}
      {theme && <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-[17px] w-[17px]" />}
    </button>
  );
}
