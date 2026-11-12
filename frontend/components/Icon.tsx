import React from 'react';

/** Small line-icon set used in place of emoji throughout the UI. */
const PATHS: Record<string, string> = {
  cloud: 'M7 18h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.2 4.4 4.4 0 0 0 7 18Z',
  mail: 'M3.75 6.75h16.5v10.5H3.75zM3.75 7.5 12 13l8.25-5.5',
  mic: 'M12 3.75a2.75 2.75 0 0 1 2.75 2.75v5a2.75 2.75 0 0 1-5.5 0v-5A2.75 2.75 0 0 1 12 3.75ZM6.75 11.25a5.25 5.25 0 0 0 10.5 0M12 16.5v3.75',
  chat: 'M4.5 5.25h15v10.5h-8.25L7.5 19.5v-3.75h-3z',
  briefcase: 'M3.75 8.25h16.5v10.5H3.75zM9 8.25V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v2.25M3.75 13.5h16.5',
  calendar: 'M4.5 6h15v13.5h-15zM4.5 10.5h15M8.25 3.75V7.5M15.75 3.75V7.5',
  doc: 'M6.75 3.75h7.5l3 3v13.5H6.75zM9.75 11.25h4.5M9.75 14.25h4.5M9.75 17.25h3',
  scale: 'M12 4.5v15M7.5 19.5h9M5.25 7.5h13.5M5.25 7.5 3 13.5a2.25 2.25 0 0 0 4.5 0L5.25 7.5ZM18.75 7.5l-2.25 6a2.25 2.25 0 0 0 4.5 0l-2.25-6Z',
  user: 'M12 11.25a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM4.5 20.25a7.5 7.5 0 0 1 15 0',
  users: 'M9 11.25a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75ZM2.25 19.5a6.75 6.75 0 0 1 13.5 0M15.75 4.65a3.375 3.375 0 0 1 0 6.45M18 13.6a6.75 6.75 0 0 1 3.75 5.9',
  alert: 'M12 9v4.5M12 16.5h.01M10.3 4.2 2.9 17.25A1.95 1.95 0 0 0 4.6 20.2h14.8a1.95 1.95 0 0 0 1.7-2.95L13.7 4.2a1.95 1.95 0 0 0-3.4 0Z',
  search: 'M10.5 17.25a6.75 6.75 0 1 0 0-13.5 6.75 6.75 0 0 0 0 13.5ZM15.3 15.3l4.95 4.95',
  arrowRight: 'M4.5 12h15M13.5 6l6 6-6 6',
  arrowUpRight: 'M7.5 16.5l9-9M9 7.5h7.5V15',
  arrowLeft: 'M19.5 12h-15M10.5 6l-6 6 6 6',
  check: 'M4.5 12.75l5.25 5.25 9.75-12',
  close: 'M6 6l12 12M18 6 6 18',
  copy: 'M8.25 8.25h11.25v11.25H8.25zM15.75 8.25V4.5H4.5v11.25h3.75',
  chevronDown: 'M6 9l6 6 6-6',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 2.25v2.25M12 19.5v2.25M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.25 12H4.5M19.5 12h2.25M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6',
  moon: 'M20.25 14.6A8.25 8.25 0 0 1 9.4 3.75a8.25 8.25 0 1 0 10.85 10.85Z',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15.5 8.5l-2 5-5 2 2-5 5-2Z',
  layers: 'M12 3.75 3 8.25l9 4.5 9-4.5-9-4.5ZM3 12.75l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5',
  pulse: 'M2.25 12h4.5l2.25-6 4.5 12 2.25-6h6',
  send: 'M4.5 12h11.25M4.5 12 3 4.5 21 12 3 19.5 4.5 12Z',
  slides: 'M3.75 4.5h16.5v11.25H3.75zM12 15.75v3.75M8.25 19.5h7.5',
  bolt: 'M13.5 3 5.25 13.5H12L10.5 21l8.25-10.5H12L13.5 3Z',
  terminal: 'M3.75 4.5h16.5v15H3.75zM7.5 9l3 3-3 3M12.75 15h3.75',
};

export type IconName = keyof typeof PATHS;

export default function Icon({
  name,
  className = 'h-4 w-4',
  strokeWidth = 1.6,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Source metadata shared by every component that names a data source. */
export const SOURCES: Record<string, { label: string; icon: IconName }> = {
  salesforce: { label: 'Salesforce', icon: 'cloud' },
  gmail: { label: 'Gmail', icon: 'mail' },
  gong: { label: 'Gong', icon: 'mic' },
  slack: { label: 'Slack', icon: 'chat' },
  linkedin: { label: 'LinkedIn', icon: 'briefcase' },
};
