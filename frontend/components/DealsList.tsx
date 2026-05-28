import React from 'react';
import DealCard from './DealCard';
import { Deal } from '../lib/types';

interface DealsListProps {
  deals: Deal[];
}

export default function DealsList({ deals }: DealsListProps) {
  if (!deals || deals.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {deals.map(deal => (
        <DealCard key={deal.deal_id} deal={deal} />
      ))}
    </div>
  );
}
