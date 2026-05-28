import React from 'react';
import { Deal } from '../lib/types';

interface DealCardProps {
  deal: Deal;
}

export default function DealCard({ deal }: DealCardProps) {
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

  return (
    <div className={`rounded-xl p-5 border backdrop-blur-md transition-all hover:scale-[1.01] shadow-lg
      ${isRed ? 'bg-red-950/20 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : ''}
      ${isAmber ? 'bg-amber-950/20 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : ''}
      ${isGreen ? 'bg-green-950/20 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : ''}
    `}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {isRed && <span className="text-red-500">🔴</span>}
            {isAmber && <span className="text-amber-500">🟡</span>}
            {isGreen && <span className="text-green-500">🟢</span>}
            {deal.deal_name}
          </h3>
          <div className="text-sm text-gray-400 mt-1">Champion: <span className="text-gray-300">{deal.champion}</span></div>
        </div>
        <div className="text-right">
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