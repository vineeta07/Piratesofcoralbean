import React from 'react';
import { SlackData } from '../lib/types';
import { LogoMark } from './Logo';
import Icon from './Icon';

interface SlackDigestProps {
  slack: SlackData | null;
}

/** Escape HTML first, then apply Slack's *bold* and _italic_ markup. */
function renderSlackLine(line: string): string {
  const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped
    .replace(/\*(.*?)\*/g, '<strong class="font-semibold text-ink">$1</strong>')
    .replace(/_(.*?)_/g, '<em class="text-ink-3 not-italic">$1</em>');
}

export default function SlackDigest({ slack }: SlackDigestProps) {
  if (!slack || !slack.blocks) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <Icon name="chat" className="h-4 w-4 text-ink-3" />
          <span className="font-semibold text-ink"># sales-pipeline</span>
        </div>
        <span className="eyebrow">Slack preview</span>
      </div>

      <div className="flex gap-3 p-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-sunken text-ink">
          <LogoMark size={26} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-bold text-ink">Coral Bean</span>
            <span className="rounded bg-sunken px-1 py-px text-[10px] font-semibold uppercase text-ink-3">App</span>
            <span className="text-xs text-ink-3">9:00 AM</span>
          </div>

          <div className="mt-2 flex flex-col gap-3">
            {slack.blocks.map((block, idx) => {
              if (!block) return null;
              if (block.type === 'header') {
                return (
                  <h3 key={idx} className="text-base font-bold text-ink">
                    {block.text?.text}
                  </h3>
                );
              }
              if (block.type === 'divider') {
                return <hr key={idx} className="border-line" />;
              }
              if (block.type === 'section') {
                const text = block.text?.text || '';
                return (
                  <div key={idx} className="text-[14px] leading-relaxed text-ink-2">
                    {text.split('\n').map((line, i) => (
                      <div key={i} className="mb-0.5" dangerouslySetInnerHTML={{ __html: renderSlackLine(line) }} />
                    ))}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
