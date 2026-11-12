'use client';

import React, { useState } from 'react';
import { PageHeader, NoAnalysis } from '../../../components/app/AppShell';
import { useDownload } from '../../../components/app/DownloadButtons';
import SlackDigest from '../../../components/SlackDigest';
import Icon, { IconName } from '../../../components/Icon';
import { formatWhen, useAnalysis } from '../../../lib/analysis';
import { downloadJson } from '../../../lib/export';

/** Turns the Slack blocks into plain mrkdwn text ready to paste into a channel. */
function slackText(blocks: { type: string; text?: { text: string } }[]) {
  return blocks
    .map((b) => (b.type === 'header' ? `*${b.text?.text ?? ''}*` : b.type === 'divider' ? '———' : b.text?.text ?? ''))
    .filter(Boolean)
    .join('\n\n');
}

export default function ReportsPage() {
  const { current } = useAnalysis();
  const { busy, failed, run } = useDownload();
  const [copied, setCopied] = useState(false);

  if (!current) {
    return (
      <>
        <PageHeader eyebrow="Reports" title="Reports & exports" />
        <NoAnalysis what="your reports" />
      </>
    );
  }

  const deals = current.result.dashboard.deals;
  const docs = current.result.documents;
  const copySlack = async () => {
    try {
      await navigator.clipboard.writeText(slackText(current.result.slack?.blocks ?? []));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Reports & exports"
        desc={
          <>
            Built from &ldquo;{current.query}&rdquo; · {formatWhen(current.at)}
          </>
        }
      />

      {/* The two main deliverables */}
      <div className="grid gap-5 md:grid-cols-2">
        <ReportCard
          kind="PDF"
          title="Pipeline risk report"
          desc="A printable report: summary numbers, then every deal with its score, signals and next step."
          pages={`${Math.max(1, Math.ceil(deals.length / 4))} page${deals.length > 4 ? 's' : ''}`}
          busy={busy === 'pdf'}
          failed={failed === 'pdf'}
          onClick={() => run('pdf', current)}
          primary
          preview={<PdfThumb />}
        />
        <ReportCard
          kind="PPTX"
          title="Pipeline review deck"
          desc="An editable PowerPoint: title, overview chart, one slide per deal and an action list."
          pages={`${Math.min(deals.length, 10) + (deals.length ? 3 : 2)} slides`}
          busy={busy === 'pptx'}
          failed={failed === 'pptx'}
          onClick={() => run('pptx', current)}
          preview={<DeckThumb />}
        />
      </div>

      {/* Server-generated files, when the backend provides them */}
      {(docs?.docx_url || docs?.pptx_url) && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl font-medium text-ink">From the backend</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {docs?.docx_url && <LinkRow href={docs.docx_url} icon="doc" title="Executive brief" kind="DOCX" />}
            {docs?.pptx_url && <LinkRow href={docs.pptx_url} icon="slides" title="Board deck" kind="PPTX" />}
          </div>
        </section>
      )}

      {/* Slack */}
      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-medium text-ink">Slack digest</h2>
            <p className="text-sm text-ink-2">Paste this into your team channel.</p>
          </div>
          <button
            onClick={copySlack}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-sm font-medium text-ink hover:border-ink"
          >
            <Icon name={copied ? 'check' : 'copy'} className="h-4 w-4" />
            {copied ? 'Copied' : 'Copy text'}
          </button>
        </div>
        <SlackDigest slack={current.result.slack} />
      </section>

      {/* Raw data */}
      <section className="mt-10 flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Raw data</h2>
          <p className="text-[13px] text-ink-2">The full JSON response, for spreadsheets or other tools.</p>
        </div>
        <button
          onClick={() => downloadJson(current)}
          className="inline-flex h-9 items-center gap-2 self-start rounded-md border border-line-strong px-3 text-sm font-medium text-ink hover:border-ink sm:self-auto"
        >
          <Icon name="terminal" className="h-4 w-4" /> Download JSON
        </button>
      </section>
    </>
  );
}

function ReportCard({
  kind,
  title,
  desc,
  pages,
  busy,
  failed,
  onClick,
  primary,
  preview,
}: {
  kind: string;
  title: string;
  desc: string;
  pages: string;
  busy: boolean;
  failed: boolean;
  onClick: () => void;
  primary?: boolean;
  preview: React.ReactNode;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex h-44 items-center justify-center border-b border-line bg-sunken">{preview}</div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <span className="rounded border border-line-strong px-1.5 py-px font-mono text-[10px] font-medium text-coral-ink">{kind}</span>
          <span className="font-mono text-[11px] text-ink-3">{pages}</span>
        </div>
        <h2 className="mt-2 font-display text-xl font-medium text-ink">{title}</h2>
        <p className="mt-1 flex-1 text-sm text-ink-2">{desc}</p>
        <button
          onClick={onClick}
          disabled={busy}
          className={`mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 ${
            primary ? 'bg-coral text-white dark:text-bg' : 'bg-ink text-bg'
          }`}
        >
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v11M7 10l5 5 5-5M5 19.5h14" />
            </svg>
          )}
          {busy ? 'Building…' : `Download ${kind}`}
        </button>
        {failed && <p className="mt-2 text-xs text-risk-red">Something went wrong building the file. Try again.</p>}
      </div>
    </div>
  );
}

function LinkRow({ href, icon, title, kind }: { href: string; icon: IconName; title: string; kind: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-md border border-line bg-surface p-4 transition-colors hover:border-line-strong"
    >
      <Icon name={icon} className="h-5 w-5 text-ink-3" />
      <span className="flex-1 text-sm font-medium text-ink">{title}</span>
      <span className="font-mono text-[11px] text-ink-3">{kind}</span>
      <Icon name="arrowUpRight" className="h-4 w-4 text-ink-3" />
    </a>
  );
}

/* Miniature document previews — decorative */
function PdfThumb() {
  return (
    <div className="h-36 w-28 rotate-[-3deg] overflow-hidden rounded-sm border border-line-strong bg-surface shadow-[0_8px_20px_-10px_rgb(0_0_0/0.35)]">
      <div className="h-7 bg-ink" />
      <div className="h-0.5 bg-coral" />
      <div className="grid grid-cols-4 gap-1 p-2">
        {['bg-ink-3', 'bg-risk-red', 'bg-risk-amber', 'bg-risk-green'].map((c) => (
          <div key={c} className="h-4 rounded-[1px] border border-line">
            <div className={`ml-0.5 mt-1.5 h-1 w-2 ${c}`} />
          </div>
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="mx-2 mb-1.5 flex gap-1">
          <div className={`w-0.5 ${['bg-risk-red', 'bg-risk-amber', 'bg-risk-green'][i]}`} />
          <div className="flex-1 space-y-0.5">
            <div className="h-1 w-3/4 bg-ink/60" />
            <div className="h-0.5 w-full bg-line-strong" />
            <div className="h-0.5 w-5/6 bg-line-strong" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DeckThumb() {
  return (
    <div className="relative h-28 w-48">
      <div className="absolute left-4 top-0 h-24 w-40 rotate-[4deg] rounded-sm border border-line-strong bg-surface" />
      <div className="absolute left-0 top-3 flex h-24 w-40 flex-col justify-between rounded-sm bg-ink p-3 shadow-[0_8px_20px_-10px_rgb(0_0_0/0.4)]">
        <div className="h-1 w-10 bg-coral" />
        <div className="space-y-1">
          <div className="h-1.5 w-28 bg-bg/80" />
          <div className="h-1.5 w-20 bg-bg/80" />
        </div>
        <div className="h-0.5 w-full bg-coral" />
      </div>
    </div>
  );
}
