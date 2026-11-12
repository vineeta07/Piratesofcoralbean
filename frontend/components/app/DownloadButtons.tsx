'use client';

import React, { useState } from 'react';
import Icon from '../Icon';
import type { Analysis } from '../../lib/analysis';
import { downloadPdf, downloadPptx } from '../../lib/export';

type Format = 'pdf' | 'pptx';

/** Compact PDF + PowerPoint buttons for a saved analysis. */
export function useDownload() {
  const [busy, setBusy] = useState<Format | null>(null);
  const [failed, setFailed] = useState<Format | null>(null);
  const run = async (format: Format, a: Analysis) => {
    setBusy(format);
    setFailed(null);
    try {
      await (format === 'pdf' ? downloadPdf(a) : downloadPptx(a));
    } catch (e) {
      console.error(e);
      setFailed(format);
    } finally {
      setBusy(null);
    }
  };
  return { busy, failed, run };
}

export default function DownloadButtons({ analysis, size = 'md' }: { analysis: Analysis; size?: 'sm' | 'md' }) {
  const { busy, failed, run } = useDownload();
  const base =
    size === 'sm'
      ? 'h-8 gap-1.5 px-2.5 text-[12.5px]'
      : 'h-10 gap-2 px-4 text-sm';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(['pdf', 'pptx'] as Format[]).map((f) => (
        <button
          key={f}
          onClick={() => run(f, analysis)}
          disabled={busy !== null}
          className={`inline-flex items-center rounded-md border font-medium transition-colors disabled:opacity-60 ${base} ${
            f === 'pdf'
              ? 'border-ink bg-ink text-bg hover:opacity-90'
              : 'border-line-strong bg-surface text-ink hover:border-ink'
          }`}
        >
          {busy === f ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Icon name={f === 'pdf' ? 'doc' : 'slides'} className="h-4 w-4" />
          )}
          {f === 'pdf' ? 'PDF' : 'PowerPoint'}
        </button>
      ))}
      {failed && <span className="text-xs text-risk-red">Couldn&rsquo;t build the {failed.toUpperCase()} — try again.</span>}
    </div>
  );
}
