export interface Deal {
  deal_id: string;
  deal_name: string;
  value: number;
  score: number;
  risk_level: 'red' | 'amber' | 'green';
  narrative: string;
  action: string;
  champion: string;
  // Rich intelligence fields from backend pipeline
  close_date?: string;
  all_reasons?: string[];       // All 11 scoring signal reasons
  primary_reason?: string;      // Top risk signal
  economic_buyer?: string;      // Economic buyer name
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

// Agent pipeline trace types
export interface AgentStep {
  name: string;
  role: string;
  status: 'pending' | 'running' | 'done' | 'error';
  duration_ms?: number;
  output_summary?: string;
  icon: string;
}

export interface PipelineTrace {
  steps: AgentStep[];
  total_duration_ms?: number;
}

// Query inspection types
export interface QueryInspection {
  intent: {
    intent: string;
    timeframe: string;
    signal: string;
    scope: string;
    urgency: string;
  };
  sources: {
    name: string;
    included: boolean;
    reason?: string;
  }[];
  generated_sql: string;
}

// Chat message type
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: ApiResponse;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
  dashboard: {
    deals: Deal[];
    summary: Summary;
  };
  slack: SlackData;
  // These are generated client-side from the response
  pipeline_trace?: PipelineTrace;
  query_inspection?: QueryInspection;
}