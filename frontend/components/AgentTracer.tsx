'use client';

import { useState, useEffect, useCallback } from 'react';
import { PipelineTrace, AgentStep } from '../lib/types';

interface AgentTracerProps {
  isRunning: boolean;
  trace?: PipelineTrace;
}

const PIPELINE_STEPS: Omit<AgentStep, 'status' | 'duration_ms' | 'output_summary'>[] = [
  { name: 'Parser Agent', role: 'Analyzing query intent', icon: '🔍' },
  { name: 'Context Agent', role: 'Selecting data sources', icon: '🗂️' },
  { name: 'Query Builder', role: 'Generating Coral SQL', icon: '🔧' },
  { name: 'Risk Scorer', role: 'Scoring deal health', icon: '⚡' },
  { name: 'Summariser', role: 'Writing narratives', icon: '📝' },
  { name: 'Formatter', role: 'Preparing outputs', icon: '📊' },
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

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-white/90 tracking-wide">Agent Pipeline</h3>

        {/* Animated running dot */}
        {isRunning && !allDone && (
          <span className="relative ml-auto flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
          </span>
        )}

        {allDone && (
          <span className="ml-auto text-[11px] font-medium text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Complete
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="relative flex flex-col gap-0">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;

          return (
            <div key={step.name} className="relative flex gap-3.5 group">
              {/* Vertical connector line */}
              {!isLast && (
                <div className="absolute left-[13px] top-[28px] bottom-0 w-px">
                  <div
                    className={`h-full w-full transition-colors duration-500 ${
                      step.status === 'done' ? 'bg-emerald-500/40' : 'bg-white/[0.06]'
                    }`}
                  />
                </div>
              )}

              {/* Step indicator node */}
              <div className="relative z-10 flex-shrink-0 mt-1">
                {step.status === 'done' ? (
                  <div className="w-[26px] h-[26px] rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center transition-all duration-300">
                    <svg
                      className="w-3 h-3 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : step.status === 'running' ? (
                  <div className="w-[26px] h-[26px] rounded-full bg-blue-500/20 border border-blue-400/60 flex items-center justify-center animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.35)]">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-[26px] h-[26px] rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center transition-all duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  </div>
                )}
              </div>

              {/* Step content card */}
              <div
                className={`flex-1 mb-2.5 rounded-xl px-3.5 py-2.5 transition-all duration-500 ${
                  step.status === 'running'
                    ? 'bg-blue-500/[0.08] border border-blue-500/25 shadow-[0_0_20px_rgba(59,130,246,0.08)]'
                    : step.status === 'done'
                    ? 'bg-emerald-500/[0.04] border border-emerald-500/15'
                    : 'bg-white/[0.02] border border-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm transition-opacity duration-300 ${
                        step.status === 'pending' ? 'opacity-30 grayscale' : 'opacity-100'
                      }`}
                    >
                      {step.icon}
                    </span>
                    <span
                      className={`text-[13px] font-medium transition-colors duration-300 ${
                        step.status === 'running'
                          ? 'text-blue-300'
                          : step.status === 'done'
                          ? 'text-white/80'
                          : 'text-white/30'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>

                  {/* Duration badge */}
                  {step.status === 'done' && step.duration_ms != null && (
                    <span className="text-[10px] font-mono text-emerald-400/70 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {step.duration_ms}ms
                    </span>
                  )}

                  {/* Running spinner */}
                  {step.status === 'running' && (
                    <svg
                      className="w-3.5 h-3.5 text-blue-400 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  )}
                </div>

                {/* Role / description */}
                <p
                  className={`text-[11px] mt-0.5 transition-colors duration-300 ${
                    step.status === 'running'
                      ? 'text-blue-300/50'
                      : step.status === 'done'
                      ? 'text-white/25'
                      : 'text-white/15'
                  }`}
                >
                  {step.role}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: total duration */}
      {allDone && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-[11px] text-white/30">Total pipeline</span>
          <span className="text-[11px] font-mono text-white/50">
            {steps.reduce((sum, s) => sum + (s.duration_ms ?? 0), 0)}ms
          </span>
        </div>
      )}
    </div>
  );
}