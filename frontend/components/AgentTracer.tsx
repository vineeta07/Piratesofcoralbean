'use client';

import { useState, useEffect } from 'react';
import { PipelineTrace, AgentStep } from '../lib/types';
import Icon from './Icon';

interface AgentTracerProps {
  isRunning: boolean;
  trace?: PipelineTrace;
}

const PIPELINE_STEPS: Omit<AgentStep, 'status' | 'duration_ms' | 'output_summary'>[] = [
  { name: 'Parser Agent', role: 'Analyzing query intent', icon: 'parse' },
  { name: 'Context Agent', role: 'Selecting data sources', icon: 'context' },
  { name: 'Query Builder', role: 'Generating Coral SQL', icon: 'query' },
  { name: 'Risk Scorer', role: 'Scoring deal health', icon: 'score' },
  { name: 'Summariser', role: 'Writing narratives', icon: 'write' },
  { name: 'Formatter', role: 'Preparing outputs', icon: 'format' },
];

function generateDuration(): number {
  return Math.floor(Math.random() * 180) + 60; // 60–240ms
}

export default function AgentTracer({ isRunning, trace }: AgentTracerProps) {
  const [steps, setSteps] = useState<AgentStep[]>(() =>
    PIPELINE_STEPS.map((s) => ({ ...s, status: 'pending' as const }))
  );
  const [activeIndex, setActiveIndex] = useState(-1);

  // Reset when a new run starts
  useEffect(() => {
    if (isRunning) {
      setSteps(PIPELINE_STEPS.map((s) => ({ ...s, status: 'pending' as const })));
      setActiveIndex(0);
    }
  }, [isRunning]);

  // Sequential animation loop
  useEffect(() => {
    if (!isRunning || activeIndex < 0 || activeIndex >= PIPELINE_STEPS.length) return;

    // Mark current step as running
    setSteps((prev) =>
      prev.map((s, i) => (i === activeIndex ? { ...s, status: 'running' as const } : s))
    );

    const timeout = setTimeout(() => {
      const dur = generateDuration();
      // Mark current step as done and advance
      setSteps((prev) =>
        prev.map((s, i) =>
          i === activeIndex ? { ...s, status: 'done' as const, duration_ms: dur } : s
        )
      );
      setActiveIndex((prev) => prev + 1);
    }, 600);

    return () => clearTimeout(timeout);
  }, [isRunning, activeIndex]);

  // When trace is provided and not running, display it
  // Otherwise, if not running and no trace, forcefully mark all simulated steps as done
  useEffect(() => {
    if (!isRunning) {
      if (trace?.steps) {
        setSteps(trace.steps);
        setActiveIndex(-1);
      } else {
        setSteps((prev) =>
          prev.map((s) => ({
            ...s,
            status: 'done' as const,
            duration_ms: s.duration_ms ?? generateDuration(),
          }))
        );
        setActiveIndex(-1);
      }
    }
  }, [isRunning, trace]);

  const allDone = steps.every((s) => s.status === 'done');
  const total = steps.reduce((sum, s) => sum + (s.duration_ms ?? 0), 0);

  return (
    <div className="rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Icon name="pulse" className="h-4 w-4 text-ink-3" />
          <h3 className="font-display text-[17px] font-medium text-ink">Agent pipeline</h3>
        </div>
        {allDone ? (
          <span className="font-mono text-[11px] text-risk-green">Complete · {total}ms</span>
        ) : (
          <span className="flex items-center gap-2 font-mono text-[11px] text-ink-3">
            <span className="h-1.5 w-1.5 rounded-full bg-coral" style={{ animation: 'typingDot 1.2s infinite' }} />
            Running
          </span>
        )}
      </div>

      <ol className="px-5 py-4">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <li key={step.name} className="relative flex gap-3.5 pb-4 last:pb-0">
              {!isLast && (
                <span
                  className={`absolute left-[11px] top-7 bottom-0 w-px ${step.status === 'done' ? 'bg-ink/40' : 'bg-line'}`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition-colors ${
                  step.status === 'done'
                    ? 'border-ink bg-ink text-bg'
                    : step.status === 'running'
                    ? 'border-coral bg-surface text-coral-ink'
                    : step.status === 'error'
                    ? 'border-risk-red bg-surface text-risk-red'
                    : 'border-line-strong bg-surface text-ink-3'
                }`}
              >
                {step.status === 'done' ? (
                  <Icon name="check" className="h-3 w-3" strokeWidth={2.5} />
                ) : step.status === 'running' ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
                ) : (
                  i + 1
                )}
              </span>
              <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3 pt-0.5">
                <div className="min-w-0">
                  <div
                    className={`text-sm font-medium ${
                      step.status === 'pending' ? 'text-ink-3' : 'text-ink'
                    }`}
                  >
                    {step.name}
                  </div>
                  <div className="text-[12.5px] text-ink-3">{step.role}</div>
                </div>
                {step.status === 'done' && step.duration_ms != null && (
                  <span className="flex-shrink-0 font-mono text-[11px] text-ink-3">{step.duration_ms}ms</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
