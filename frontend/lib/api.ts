import { ApiResponse, QueryInspection } from './types';

const API_URL = 'http://localhost:8000/api';

/**
 * Generates a simulated QueryInspection from the user query.
 * In production this would come from the backend, but the current API
 * doesn't return this data so we synthesise it client-side.
 */
function generateQueryInspection(query: string): QueryInspection {
  const q = query.toLowerCase();

  let intent = 'general_scan';
  let timeframe = 'all_time';
  let signal = 'all';
  let scope = 'all_deals';
  let urgency = 'normal';

  if (q.includes('risk') || q.includes('silent') || q.includes('danger')) {
    intent = 'risk_scan';
    signal = 'email_silence';
    urgency = 'high';
  } else if (q.includes('forecast') || q.includes('revenue') || q.includes('predict')) {
    intent = 'forecast';
    signal = 'revenue_projection';
    scope = 'pipeline';
  } else if (q.includes('objection') || q.includes('concern')) {
    intent = 'objections';
    signal = 'objections';
    urgency = 'high';
  }

  if (q.includes('this month') || q.includes('closing')) {
    timeframe = 'this_month';
  } else if (q.includes('quarter') || q.includes('q3') || q.includes('q4')) {
    timeframe = 'this_quarter';
  }

  // Determine which sources are needed based on intent
  const allSources = ['salesforce', 'gmail', 'gong', 'slack', 'linkedin'];
  let includedSources: string[] = allSources;

  if (signal === 'email_silence') {
    includedSources = ['salesforce', 'gmail'];
  } else if (intent === 'forecast') {
    includedSources = ['salesforce'];
  } else if (signal === 'objections') {
    includedSources = ['salesforce', 'gong', 'slack'];
  }

  const sources = allSources.map((name) => ({
    name,
    included: includedSources.includes(name),
    reason: includedSources.includes(name)
      ? 'Required for analysis'
      : 'Not relevant to this query',
  }));

  // Generate a plausible SQL query
  const joins = includedSources
    .filter((s) => s !== 'salesforce')
    .map((s) => {
      const table = s === 'gmail' ? 'gmail.threads' : s === 'gong' ? 'gong.calls' : s === 'slack' ? 'slack.messages' : 'linkedin.profiles';
      return `JOIN ${table} ON ${table}.deal_id = s.deal_id`;
    });

  const generated_sql = [
    `SELECT s.deal_id, s.deal_name, s.value, s.stage, s.owner, s.close_date`,
    `FROM salesforce.deals s`,
    ...joins,
    timeframe === 'this_month'
      ? `WHERE s.close_date <= '2024-06-30'`
      : timeframe === 'this_quarter'
      ? `WHERE s.close_date <= '2024-09-30'`
      : `WHERE s.stage != 'Closed Lost'`,
    `ORDER BY s.value DESC`,
  ].join('\n');

  return {
    intent: { intent, timeframe, signal, scope, urgency },
    sources,
    generated_sql,
  };
}

export const analyzeQuery = async (query: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Normalise the backend response to match our ApiResponse interface
    const apiResponse: ApiResponse = {
      success: data.success ?? true,
      error: data.error,
      dashboard: {
        deals: (data.dashboard?.deals || []).map((deal: any) => ({
          deal_id: deal.deal_id || '',
          deal_name: deal.deal_name || 'Unknown',
          value: deal.value || 0,
          score: deal.score || 50,
          risk_level: deal.risk_level || 'green',
          narrative: deal.narrative || deal.summary || '',
          action: deal.action || deal.primary_reason || 'Monitor deal health',
          champion: deal.champion || deal.champion_name || 'Unknown',
          close_date: deal.close_date || '',
          all_reasons: deal.all_reasons || [],
          primary_reason: deal.primary_reason || '',
          economic_buyer: deal.economic_buyer || '',
        })),
        summary: data.dashboard?.summary || {
          total_deals: 0,
          red_count: 0,
          amber_count: 0,
          green_count: 0,
        },
      },
      slack: data.slack || { blocks: [] },
    };

    // Enrich with client-side generated inspection data
    apiResponse.query_inspection = generateQueryInspection(query);

    return apiResponse;
  } catch (error) {
    console.error("Error calling backend API:", error);
    throw error;
  }
};