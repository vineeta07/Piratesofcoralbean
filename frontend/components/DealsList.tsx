import React from 'react';
import DealCard from './DealCard';
import { Deal } from '../lib/types';

interface DealsListProps {
  deals: Deal[];
}

export default function DealsList({ deals }: DealsListProps) {
  if (!deals || deals.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong p-8 text-center text-sm text-ink-2">
        No deals matched this question. Try widening the timeframe or asking about a different signal.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {deals.map((deal) => (
        <DealCard key={deal.deal_id} deal={deal} />
      ))}
    </div>
  );
}
