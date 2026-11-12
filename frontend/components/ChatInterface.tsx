'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ApiResponse } from '../lib/types';
import { LogoMark } from './Logo';
import Icon from './Icon';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onSendQuery: (query: string) => Promise<ApiResponse>;
}

const QUICK_ACTIONS = [
  'Show risky deals',
  'Forecast this quarter',
  'Silent prospects',
];

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function riskDot(level: string): string {
  if (level === 'red') return 'bg-risk-red';
  if (level === 'amber') return 'bg-risk-amber';
  if (level === 'green') return 'bg-risk-green';
  return 'bg-ink-3';
}

function Avatar() {
  return (
    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sunken text-ink">
      <LogoMark size={22} />
    </div>
  );
}

/* ── Typing indicator with bouncing dots ─────────────────────────── */
function TypingIndicator() {
  return (
    <div className="mb-4 flex items-start gap-2.5">
      <Avatar />
      <div className="flex items-center gap-1 rounded-lg border border-line bg-surface px-3.5 py-3">
        {[0, 0.2, 0.4].map((d) => (
          <span
            key={d}
            className="h-1.5 w-1.5 rounded-full bg-ink-2"
            style={{ animation: `typingDot 1.2s ease-in-out ${d}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Format AI response with deal data ───────────────────────────── */
function AssistantContent({ message }: { message: ChatMessage }) {
  const data = message.data;

  if (data?.error) {
    return (
      <div className="text-sm">
        <p className="mb-1 flex items-center gap-1.5 font-semibold text-risk-red">
          <Icon name="alert" className="h-4 w-4" /> Couldn&rsquo;t reach the pipeline
        </p>
        <p className="whitespace-pre-wrap font-mono text-xs text-ink-2">{data.error}</p>
      </div>
    );
  }

  if (!data || !data.dashboard?.deals?.length) {
    return <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{message.content}</p>;
  }

  const { deals, summary } = data.dashboard;

  return (
    <div className="space-y-3">
      {summary && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-wide text-ink-3">
          <span>
            {summary.total_deals} deal{summary.total_deals !== 1 ? 's' : ''}
          </span>
          {summary.red_count > 0 && (
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-risk-red" />{summary.red_count}</span>
          )}
          {summary.amber_count > 0 && (
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-risk-amber" />{summary.amber_count}</span>
          )}
          {summary.green_count > 0 && (
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-risk-green" />{summary.green_count}</span>
          )}
        </p>
      )}

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{message.content}</p>

      <ul className="divide-y divide-line overflow-hidden rounded-md border border-line">
        {deals.slice(0, 5).map((deal) => (
          <li key={deal.deal_id} className="space-y-1 bg-bg/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${riskDot(deal.risk_level)}`} />
                <span className="truncate">{deal.deal_name}</span>
              </span>
              <span className="flex-shrink-0 font-mono text-xs text-ink-2">{formatCurrency(deal.value)}</span>
            </div>
            <p className="text-xs leading-snug text-ink-2">{deal.narrative}</p>
            {deal.action && (
              <p className="flex items-start gap-1 text-xs font-medium text-coral-ink">
                <Icon name="arrowRight" className="mt-px h-3 w-3 flex-shrink-0" strokeWidth={2} /> {deal.action}
              </p>
            )}
          </li>
        ))}
      </ul>
      {deals.length > 5 && (
        <p className="text-center text-xs text-ink-3">
          + {deals.length - 5} more deal{deals.length - 5 !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

/* ── Main ChatInterface ──────────────────────────────────────────── */
export default function ChatInterface({ isOpen, onClose, onSendQuery }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  const handleSend = useCallback(
    async (text: string) => {
      const query = text.trim();
      if (!query || isLoading) return;

      // Add user message
      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: query,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const response = await onSendQuery(query);

        // Build readable content from deals
        let content = '';
        if (response.success && response.dashboard?.deals?.length) {
          const { deals, summary } = response.dashboard;
          const lines: string[] = [];

          if (summary.red_count > 0) {
            lines.push(`I found ${summary.red_count} high-risk deal${summary.red_count > 1 ? 's' : ''} that need${summary.red_count === 1 ? 's' : ''} attention.`);
          }
          if (summary.amber_count > 0) {
            lines.push(`${summary.amber_count} deal${summary.amber_count > 1 ? 's are' : ' is'} showing amber signals.`);
          }
          if (summary.green_count > 0) {
            lines.push(`${summary.green_count} deal${summary.green_count > 1 ? 's are' : ' is'} on track.`);
          }

          if (lines.length === 0) {
            lines.push(`Here are ${deals.length} deal${deals.length > 1 ? 's' : ''} matching your query.`);
          }

          content = lines.join(' ');
        } else if (response.error) {
          content = `Sorry, I encountered an issue: ${response.error}`;
        } else {
          content = 'No deals matched your query. Try refining your question.';
        }

        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content,
          timestamp: new Date(),
          data: response,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: 'Something went wrong while processing your request. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, onSendQuery],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden />}

      <div
        className={`fixed bottom-0 right-0 z-50 flex max-h-[min(640px,calc(100vh-2rem))] w-full flex-col border border-line bg-surface shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)] transition-all duration-200 ease-out sm:bottom-4 sm:right-4 sm:w-[420px] sm:rounded-lg ${
          isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
        role="dialog"
        aria-label="Ask Coral"
        aria-hidden={!isOpen}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2.5">
            <LogoMark size={30} className="text-ink" />
            <div>
              <h2 className="font-display text-[16px] font-medium leading-tight text-ink">Ask Coral</h2>
              <p className="text-[11px] text-ink-3">Questions about your pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
            aria-label="Close chat"
          >
            <Icon name="close" className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div ref={scrollRef} className="min-h-[260px] flex-1 overflow-y-auto overscroll-contain bg-bg px-4 py-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <LogoMark size={48} className="text-ink" />
              <p className="mt-4 font-display text-lg text-ink">What should we look at?</p>
              <p className="mt-1 max-w-[260px] text-[13px] text-ink-2">
                Ask about deal health, forecasts, silent prospects or competitor activity.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`mb-4 flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && <Avatar />}
              <div
                className={`rounded-lg px-3.5 py-2.5 ${
                  msg.role === 'user' ? 'max-w-[80%] bg-ink text-bg' : 'max-w-[85%] border border-line bg-surface'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                ) : (
                  <AssistantContent message={msg} />
                )}
                <p className={`mt-1.5 font-mono text-[10px] ${msg.role === 'user' ? 'opacity-60' : 'text-ink-3'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && <TypingIndicator />}
        </div>

        <div className="flex-shrink-0 space-y-2.5 border-t border-line px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => handleSend(action)}
                disabled={isLoading}
                className="flex-shrink-0 rounded-full border border-line px-3 py-1 text-[12px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                {action}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your deals…"
              disabled={isLoading}
              aria-label="Message"
              className="flex-1 rounded-md border border-line-strong bg-bg px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus-visible:outline-none disabled:opacity-50"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-coral text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30 dark:text-bg"
              aria-label="Send message"
            >
              <Icon name="send" className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
