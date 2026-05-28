export interface Deal {
  deal_id: string;
  deal_name: string;
  value: number;
  score: number;
  risk_level: 'red' | 'amber' | 'green';
  narrative: string;
  action: string;
  champion: string;
}

export interface Summary {
  total_deals: number;
  red_count: number;
  amber_count: number;
  green_count: number;
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
}

export interface SlackData {
  blocks: SlackBlock[];
}

export interface ApiResponse {
  success: boolean;
  error?: string;
  dashboard: {
    deals: Deal[];
    summary: Summary;
  };
  slack: SlackData;
}