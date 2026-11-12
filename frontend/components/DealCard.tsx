'use client';

import React, { useState } from 'react';
import { Deal } from '../lib/types';
import Icon, { IconName } from './Icon';

interface DealCardProps {
  deal: Deal;
}

/* ─── Map reason text to a source icon + label ─── */
function parseSignalSource(reason: string): { icon: IconName; label: string } {
  const r = reason.toLowerCase();
  if (r.includes('email') || r.includes('silence') || r.includes('follow-up')) return { icon: 'mail', label: 'Gmail' };
  if (r.includes('gong') || r.includes('sentiment') || r.includes('call')) return { icon: 'mic', label: 'Gong' };
  if (r.includes('champion') || r.includes('changed jobs') || r.includes('hiring'))
    return { icon: 'briefcase', label: 'LinkedIn' };
  if (r.includes('competitor') || r.includes('mentioned')) return { icon: 'chat', label: 'Slack' };
  if (r.includes('multi-thread') || r.includes('single-threaded') || r.includes('id signal'))
    return { icon: 'users', label: 'Threading' };
  if (r.includes('touchpoint') || r.includes('meeting') || r.includes('scheduled') || r.includes('follow-up booked'))
    return { icon: 'calendar', label: 'Calendar' };
  if (r.includes('notion') || r.includes('strategy doc')) return { icon: 'doc', label: 'Notion' };
  if (r.includes('legal') || r.includes('contract')) return { icon: 'scale', label: 'Legal' };
  if (r.includes('economic buyer') || r.includes('buyer')) return { icon: 'user', label: 'Econ. buyer' };
  if (r.includes('objection') || r.includes('pricing') || r.includes('value') || r.includes('compliance'))
    return { icon: 'alert', label: 'Objection' };
  return { icon: 'cloud', label: 'Salesforce' };
}

/* ─── Extract deduction value from reason string ─── */
function extractDeduction(reason: string): { sign: '+' | '-'; value: number } | null {
  const match = reason.match(/^\(([+-])(\d+)\)/);
  return match ? { sign: match[1] as '+' | '-', value: parseInt(match[2], 10) } : null;
}

function cleanReasonText(reason: string): string {
  return reason.replace(/^\([+-]\d+\)\s*/, '');
}

const LEVEL = {
  red: { label: 'At risk', text: 'text-risk-red', bar: 'bg-risk-red', soft: 'bg-risk-red/[0.07] border-risk-red/25' },
  amber: { label: 'Watch', text: 'text-risk-amber', bar: 'bg-risk-amber', soft: 'bg-risk-amber/[0.08] border-risk-amber/25' },
  green: { label: 'On course', text: 'text-risk-green', bar: 'bg-risk-green', soft: 'bg-risk-green/[0.07] border-risk-green/25' },
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export default function DealCard({ deal }: DealCardProps) {
  const [showAllSignals, setShowAllSignals] = useState(false);
  const lv = LEVEL[deal.risk_level] ?? LEVEL.amber;

  const reasons = deal.all_reasons || [];
  const visibleReasons = showAllSignals ? reasons : reasons.slice(0, 4);
  const hasMore = reasons.length > 4;

  return (
    <article className="relative overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-line-strong">
      {/* Risk stripe */}
      <span className={`absolute inset-y-0 left-0 w-1 ${lv.bar}`} aria-hidden />

      <div className="p-5 pl-6">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className={`eyebrow mb-1.5 !text-[10.5px] ${lv.text}`}>{lv.label}</div>
            <h3 className="font-display text-xl font-medium leading-snug text-ink">{deal.deal_name}</h3>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
              <span>
                <span className="text-ink-3">Champion</span> {deal.champion}
              </span>
              {deal.economic_buyer && (
                <span>
                  <span className="text-ink-3">EB</span> {deal.economic_buyer}
                </span>
              )}
              {deal.close_date && (
                <span>
                  <span className="text-ink-3">Close</span> {deal.close_date}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="font-display text-xl font-medium tabular-nums text-ink">{formatCurrency(deal.value)}</div>
            <div className={`mt-1 font-mono text-xs ${lv.text}`}>{deal.score}/100</div>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-sunken">
          <div className={`h-full rounded-full ${lv.bar}`} style={{ width: `${Math.min(Math.max(deal.score, 0), 100)}%` }} />
        </div>

        {/* ── Signals ── */}
        {reasons.length > 0 && (
          <div className="mt-5">
            <div className="eyebrow mb-2">Signals · {reasons.length}</div>
            <ul className="divide-y divide-line rounded-md border border-line">
              {visibleReasons.map((reason, idx) => {
                const source = parseSignalSource(reason);
                const deduction = extractDeduction(reason);
                return (
                  <li key={idx} className="flex items-start gap-3 px-3 py-2.5 text-[13px]">
                    <Icon name={source.icon} className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-3" />
                    <div className="min-w-0 flex-1">
                      <span className="mr-1.5 font-medium text-ink">{source.label}</span>
                      <span className="break-words leading-snug text-ink-2">{cleanReasonText(reason)}</span>
                    </div>
                    {deduction && (
                      <span
                        className={`flex-shrink-0 font-mono text-[11px] font-medium ${
                          deduction.sign === '+' ? 'text-risk-green' : 'text-risk-red'
                        }`}
                      >
                        {deduction.sign}
                        {deduction.value}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {hasMore && (
              <button
                onClick={() => setShowAllSignals(!showAllSignals)}
                className="mt-2 text-[12px] font-medium text-coral-ink hover:underline"
              >
                {showAllSignals ? 'Show fewer' : `Show ${reasons.length - 4} more`}
              </button>
            )}
          </div>
        )}

        {/* ── Narrative + action ── */}
        <p className="mt-5 text-sm leading-relaxed text-ink-2">{deal.narrative}</p>
        {deal.action && (
          <div className={`mt-3 flex items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-sm ${lv.soft}`}>
            <Icon name="arrowRight" className={`mt-0.5 h-4 w-4 flex-shrink-0 ${lv.text}`} strokeWidth={2} />
            <span className="text-ink">
              <span className="font-semibold">Next: </span>
              {deal.action}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
