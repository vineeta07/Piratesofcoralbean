import type { IconName } from '../components/Icon';

/** Work out which source a scoring reason came from, from its wording. */
export function parseSignalSource(reason: string): { icon: IconName; label: string } {
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

/** "(-20) Email silence…" → { sign: '-', value: 20 } */
export function extractDeduction(reason: string): { sign: '+' | '-'; value: number } | null {
  const match = reason.match(/^\(([+-])(\d+)\)/);
  return match ? { sign: match[1] as '+' | '-', value: parseInt(match[2], 10) } : null;
}

export function cleanReasonText(reason: string): string {
  return reason.replace(/^\([+-]\d+\)\s*/, '');
}
