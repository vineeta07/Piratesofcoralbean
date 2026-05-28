import React from 'react';

interface SummaryStatsProps {
  summary: {
    total_deals: number;
    red_count: number;
    amber_count: number;
    green_count: number;
  } | null;
}

export default function SummaryStats({ summary }: SummaryStatsProps) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex flex-col items-center justify-center">
        <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Total Deals</div>
        <div className="text-3xl font-bold text-white mt-1">{summary.total_deals}</div>
      </div>
      
      <div className="bg-red-500/10 backdrop-blur-md rounded-xl p-4 border border-red-500/30 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
        <div className="text-sm text-red-400 uppercase tracking-wider font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"></span> At Risk
        </div>
        <div className="text-3xl font-bold text-red-400 mt-1">{summary.red_count}</div>
      </div>
      
      <div className="bg-amber-500/10 backdrop-blur-md rounded-xl p-4 border border-amber-500/30 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.1)]">
        <div className="text-sm text-amber-400 uppercase tracking-wider font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Needs Attention
        </div>
        <div className="text-3xl font-bold text-amber-400 mt-1">{summary.amber_count}</div>
      </div>
      
      <div className="bg-green-500/10 backdrop-blur-md rounded-xl p-4 border border-green-500/30 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.1)]">
        <div className="text-sm text-green-400 uppercase tracking-wider font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span> On Track
        </div>
        <div className="text-3xl font-bold text-green-400 mt-1">{summary.green_count}</div>
      </div>
    </div>
  );
}
