'use client';

import React, { useState } from 'react';
import { Deal } from '../lib/types';

interface DealCardProps {
  deal: Deal;
}

/* ─── Map reason text to a source icon + label ─── */
function parseSignalSource(reason: string): { icon: string; label: string; color: string } {
  const r = reason.toLowerCase();
  if (r.includes('email') || r.includes('silence') || r.includes('follow-up'))
    return { icon: '📧', label: 'Gmail', color: 'text-red-400' };
  if (r.includes('gong') || r.includes('sentiment') || r.includes('call'))
    return { icon: '🎙️', label: 'Gong', color: 'text-purple-400' };
  if (r.includes('champion') || r.includes('changed jobs') || r.includes('hiring'))
    return { icon: '💼', label: 'LinkedIn', color: 'text-sky-400' };
  if (r.includes('competitor') || r.includes('mentioned'))
    return { icon: '💬', label: 'Slack', color: 'text-emerald-400' };
  if (r.includes('multi-thread') || r.includes('single-threaded') || r.includes('id signal'))
    return { icon: '👥', label: 'Threading', color: 'text-violet-400' };
  if (r.includes('touchpoint') || r.includes('meeting') || r.includes('scheduled') || r.includes('follow-up booked'))
    return { icon: '📅', label: 'Calendar', color: 'text-cyan-400' };
  if (r.includes('notion') || r.includes('strategy doc'))
    return { icon: '📝', label: 'Notion', color: 'text-orange-400' };
  if (r.includes('legal') || r.includes('contract'))
    return { icon: '⚖️', label: 'Legal', color: 'text-yellow-400' };
  if (r.includes('economic buyer') || r.includes('buyer'))
    return { icon: '👔', label: 'EB Signal', color: 'text-blue-400' };
  if (r.includes('objection') || r.includes('pricing') || r.includes('value') || r.includes('compliance'))
    return { icon: '⚠️', label: 'Objection', color: 'text-amber-400' };
  // Salesforce default
  return { icon: '☁️', label: 'Salesforce', color: 'text-blue-300' };
}

/* ─── Extract deduction value from reason string ─── */
function extractDeduction(reason: string): { sign: '+' | '-'; value: number } | null {
  const match = reason.match(/^\(([+-])(\d+)\)/);
  if (match) {
    return { sign: match[1] as '+' | '-', value: parseInt(match[2], 10) };
  }
  return null;
}

/* ─── Clean reason text (remove the deduction prefix) ─── */
function cleanReasonText(reason: string): string {
  return reason.replace(/^\([+-]\d+\)\s*/, '');
}

export default function DealCard({ deal }: DealCardProps) {
  const [showAllSignals, setShowAllSignals] = useState(false);

  const isRed = deal.risk_level === 'red';
  const isAmber = deal.risk_level === 'amber';
  const isGreen = deal.risk_level === 'green';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const reasons = deal.all_reasons || [];
  const visibleReasons = showAllSignals ? reasons : reasons.slice(0, 4);
  const hasMore = reasons.length > 4;

  return (
    <div className={`rounded-xl p-5 border backdrop-blur-md transition-all hover:scale-[1.01] shadow-lg
      ${isRed ? 'bg-red-950/20 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : ''}
      ${isAmber ? 'bg-amber-950/20 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : ''}
      ${isGreen ? 'bg-green-950/20 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : ''}
    `}>
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {isRed && <span className="text-red-500">🔴</span>}
            {isAmber && <span className="text-amber-500">🟡</span>}
            {isGreen && <span className="text-green-500">🟢</span>}
            {deal.deal_name}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <div className="text-sm text-gray-400">Champion: <span className="text-gray-300">{deal.champion}</span></div>
            {deal.economic_buyer && (
              <div className="text-sm text-gray-400">EB: <span className="text-gray-300">{deal.economic_buyer}</span></div>
            )}
          </div>
          {deal.close_date && (
            <div className="text-xs text-gray-500 mt-0.5">Close: {deal.close_date}</div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl font-bold text-white">{formatCurrency(deal.value)}</div>
          <div className={`text-xs font-semibold px-2 py-1 rounded-full mt-1 inline-block
            ${isRed ? 'bg-red-500/20 text-red-400' : ''}
            ${isAmber ? 'bg-amber-500/20 text-amber-400' : ''}
            ${isGreen ? 'bg-green-500/20 text-green-400' : ''}
          `}>
            Score: {deal.score}/100
          </div>
        </div>
      </div>

      {/* ── Cross-Source Evidence Signals ── */}
      {reasons.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2 flex items-center gap-1.5">
            <span>⚡</span> Intelligence Signals ({reasons.length})
          </div>
          <div className="flex flex-col gap-1.5">
            {visibleReasons.map((reason, idx) => {
              const source = parseSignalSource(reason);
              const deduction = extractDeduction(reason);
              const cleanText = cleanReasonText(reason);

              return (
                <div
                  key={idx}
                  className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-xs group hover:bg-white/[0.06] transition-colors"
                >
                  <span className="flex-shrink-0 text-sm mt-px">{source.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[9px] font-semibold uppercase tracking-wider ${source.color} opacity-70`}>
                      {source.label}
                    </span>
                    <p className="text-gray-300 leading-snug mt-0.5 break-words">{cleanText}</p>
                  </div>
                  {deduction && (
                    <span className={`flex-shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      deduction.sign === '+' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                    }`}>
                      {deduction.sign}{deduction.value}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {hasMore && (
            <button
              onClick={() => setShowAllSignals(!showAllSignals)}
              className="text-[11px] text-blue-400 hover:text-blue-300 mt-2 font-medium transition-colors"
            >
              {showAllSignals ? '← Show less' : `+ ${reasons.length - 4} more signals`}
            </button>
          )}
        </div>
      )}
      
      {/* ── AI Narrative ── */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-sm text-gray-300 mb-3 leading-relaxed">{deal.narrative}</p>
        <div className={`text-sm font-medium p-3 rounded-lg flex items-start gap-2
          ${isRed ? 'bg-red-500/10 text-red-200 border border-red-500/20' : ''}
          ${isAmber ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20' : ''}
          ${isGreen ? 'bg-green-500/10 text-green-200 border border-green-500/20' : ''}
        `}>
          <span className="mt-0.5">→</span>
          <span>{deal.action}</span>
        </div>
      </div>
    </div>
  );
}