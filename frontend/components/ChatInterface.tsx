'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ApiResponse } from '../lib/types';

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

function riskBadge(level: string): string {
  switch (level) {
    case 'red':
      return '🔴';
    case 'amber':
      return '🟡';
    case 'green':
      return '🟢';
    default:
      return '⚪';
  }
}

/* ── Typing indicator with bouncing dots ─────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 mb-4">
      {/* Avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-[10px] font-bold text-cyan-300 select-none">
        CI
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-[bounce_1.2s_ease-in-out_infinite]" />
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-[bounce_1.2s_ease-in-out_0.2s_infinite]" />
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-[bounce_1.2s_ease-in-out_0.4s_infinite]" />
        </div>
      </div>
    </div>
  );
}

/* ── Format AI response with deal data ───────────────────────────── */
function AssistantContent({ message }: { message: ChatMessage }) {
  const data = message.data;

  // If there's no structured data, just show the text
  if (!data || !data.dashboard?.deals?.length) {
    return <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{message.content}</p>;
  }

  const { deals, summary } = data.dashboard;

  return (
    <div className="space-y-3">
      {/* Summary line */}
      {summary && (
        <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">
          {summary.total_deals} deal{summary.total_deals !== 1 ? 's' : ''} found
          {summary.red_count > 0 && <span className="ml-2">🔴 {summary.red_count}</span>}
          {summary.amber_count > 0 && <span className="ml-2">🟡 {summary.amber_count}</span>}
          {summary.green_count > 0 && <span className="ml-2">🟢 {summary.green_count}</span>}
        </p>
      )}

      {/* Narrative */}
      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{message.content}</p>

      {/* Deal cards */}
      <div className="space-y-2 pt-1">
        {deals.slice(0, 5).map((deal) => (
          <div
            key={deal.deal_id}
            className="bg-white/5 border border-white/[0.07] rounded-xl p-3 space-y-1.5 hover:bg-white/[0.08] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white truncate max-w-[60%]">
                {riskBadge(deal.risk_level)} {deal.deal_name}
              </span>
              <span className="text-xs font-semibold text-cyan-400">{formatCurrency(deal.value)}</span>
            </div>

            <p className="text-xs text-gray-400 leading-snug">{deal.narrative}</p>

            {deal.action && (
              <p className="text-xs text-amber-400/90 font-medium flex items-center gap-1">
                <span className="opacity-70">⚡</span> {deal.action}
              </p>
            )}
          </div>
        ))}

        {deals.length > 5 && (
          <p className="text-xs text-gray-500 text-center pt-1">
            + {deals.length - 5} more deal{deals.length - 5 !== 1 ? 's' : ''}
          </p>
        )}
      </div>
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
      {/* Backdrop – subtle darkening */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Chat Panel */}
      <div
        className={`fixed bottom-0 right-4 z-50 w-[420px] max-h-[600px] flex flex-col
          bg-gray-950/80 backdrop-blur-2xl border border-white/10 rounded-t-2xl shadow-2xl shadow-black/50
          transition-all duration-300 ease-out origin-bottom
          ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95 pointer-events-none'}
        `}
        role="dialog"
        aria-label="Coral Chat"
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-lg" role="img" aria-label="bot">🤖</span>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Coral Chat</h2>
              <p className="text-[10px] text-cyan-400/80 font-medium tracking-wide">AI Deal Intelligence</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.07] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 active:scale-90"
            aria-label="Close chat"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Messages Area ──────────────────────────────────────── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-1 scroll-smooth"
          style={{ maxHeight: 'calc(600px - 56px - 110px)' }}
        >
          {/* Welcome state */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-white/10 flex items-center justify-center text-2xl">
                🤖
              </div>
              <div>
                <p className="text-sm font-medium text-white">How can I help?</p>
                <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
                  Ask me about deal health, forecasts, risk analysis, and pipeline insights.
                </p>
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-[10px] font-bold text-cyan-300 mr-2.5 mt-0.5 select-none">
                  CI
                </div>
              )}

              <div
                className={`relative max-w-[${msg.role === 'user' ? '80' : '85'}%] px-4 py-2.5 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white/10 backdrop-blur-md border border-white/10 text-gray-200 rounded-bl-md'
                }`}
                style={{ maxWidth: msg.role === 'user' ? '80%' : '85%' }}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                ) : (
                  <AssistantContent message={msg} />
                )}

                <p className={`text-[9px] mt-1.5 ${msg.role === 'user' ? 'text-blue-200/60' : 'text-gray-500'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator />}
        </div>

        {/* ── Quick Actions + Input ──────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-white/[0.07] bg-gray-950/50 backdrop-blur-xl px-4 py-3 rounded-b-none space-y-3">
          {/* Quick action chips */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => handleSend(action)}
                disabled={isLoading}
                className="flex-shrink-0 text-[11px] font-medium text-gray-300 px-3 py-1.5 rounded-full bg-white/10 border border-white/[0.07] hover:bg-white/20 hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your deals..."
              disabled={isLoading}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200 disabled:opacity-50"
            />

            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 flex-shrink-0"
              aria-label="Send message"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

    </>
  );
}