/**
 * tracer.ts — Structured observability for the Samaira agentic loop.
 *
 * Writes every trace event to:
 *  1. stdout (as structured JSON via logger — always, even if DB fails)
 *  2. Neon Postgres `traces` table (fire-and-forget, never blocks main flow)
 *
 * Events persisted: turn_start, turn_end, tool_call, tool_error,
 *                   circuit_breaker, curated_hit, unknown_tool
 *
 * ADMIN ONLY — never exposed to end users.
 */

import { sql } from './db';
import { logger } from './logger';

export interface TracePayload {
  traceId: string;
  [key: string]: any;
}

function persist(event: string, data: TracePayload): void {
  // Fire-and-forget — the main chat flow must never wait on this.
  sql`
    INSERT INTO traces (trace_id, event, data)
    VALUES (${data.traceId}, ${event}, ${JSON.stringify(data)}::jsonb)
  `.catch((err: any) => {
    // Only log the failure — never re-throw.
    logger.error('[Tracer] Failed to persist trace', { event, error: err.message });
  });
}

export const tracer = {
  turnStart(data: {
    traceId: string;
    userId: string;
    sessionId: string;
    profileId: string;
    query: string;
  }) {
    logger.info('[Trace] Turn start', data);
    persist('turn_start', data);
  },

  curatedHit(data: {
    traceId: string;
    userId: string;
    sessionId: string;
    latency_ms: number;
    query: string;
  }) {
    logger.info('[Trace] Curated hit', data);
    persist('curated_hit', data);
  },

  llmCall(data: {
    traceId: string;
    step: number;
    latency_ms: number;
    model: string;
    finish_reason: string;
    prompt_tokens: number | null;
    completion_tokens: number | null;
  }) {
    // LLM calls are high-frequency — log to stdout only, not DB (captured in turn_end)
    logger.info('[Trace] LLM call', data);
  },

  toolCall(data: {
    traceId: string;
    step: number;
    tool: string;
    latency_ms: number;
  }) {
    logger.info('[Trace] Tool call', data);
    // Not persisted individually — captured in turn_end.tools_called[]
  },

  toolError(data: {
    traceId: string;
    step: number;
    tool: string;
    latency_ms: number;
    error: string;
  }) {
    logger.error('[Trace] Tool error', data);
    persist('tool_error', data);
  },

  unknownTool(data: {
    traceId: string;
    step: number;
    tool: string;
  }) {
    logger.warn('[Trace] Unknown tool hallucinated', data);
    persist('unknown_tool', data);
  },

  circuitBreaker(data: {
    traceId: string;
    step: number;
    tools_this_turn: string[];
  }) {
    logger.warn('[Trace] Circuit-breaker fired — reconcile_plan missing', data);
    persist('circuit_breaker', data);
  },

  outputGuardrail(data: {
    traceId: string;
    step: number;
    original_length: number;
    sanitized_length: number;
  }) {
    logger.warn('[Trace] Output guardrail rewrote final text', data);
    // Not persisted individually — informational only
  },

  turnEnd(data: {
    traceId: string;
    userId: string;
    sessionId: string;
    total_latency_ms: number;
    steps: number;
    tools_called: Array<{ step: number; tool: string; latency_ms: number }>;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_cost_usd: number;
  }) {
    logger.info('[Trace] Turn end', data);
    persist('turn_end', data);
  },
};
