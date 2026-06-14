import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY ?? '';
const COOKIE_NAME = 'octaraa_admin_token';

function isAuthorized(req: NextRequest): boolean {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  return !!ADMIN_SECRET && cookie === ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const range = req.nextUrl.searchParams.get('range') ?? '24h';
  const intervalMap: Record<string, string> = {
    '1h':  '1 hour',
    '24h': '24 hours',
    '7d':  '7 days',
    '30d': '30 days',
  };
  const interval = intervalMap[range] ?? '24 hours';

  // ── 1. Summary stats ──────────────────────────────────────────────────────
  const summaryRows = await sql`
    SELECT
      COUNT(*)                                        AS total_turns,
      ROUND(AVG((data->>'total_latency_ms')::numeric))AS avg_latency_ms,
      COALESCE(SUM((data->>'total_tokens')::numeric), 0)    AS total_tokens,
      COALESCE(SUM((data->>'estimated_cost_usd')::numeric), 0) AS total_cost_usd
    FROM traces
    WHERE event = 'turn_end'
      AND created_at > NOW() - ${interval}::interval
  `;

  const circuitBreakerCount = await sql`
    SELECT COUNT(*) AS count
    FROM traces
    WHERE event = 'circuit_breaker'
      AND created_at > NOW() - ${interval}::interval
  `;

  const curatedHitCount = await sql`
    SELECT COUNT(*) AS count
    FROM traces
    WHERE event = 'curated_hit'
      AND created_at > NOW() - ${interval}::interval
  `;

  // ── 2. Tool usage stats ───────────────────────────────────────────────────
  const toolStats = await sql`
    SELECT
      tool_entry->>'tool'                              AS tool_name,
      COUNT(*)                                         AS call_count,
      ROUND(AVG((tool_entry->>'latency_ms')::numeric)) AS avg_latency_ms,
      MIN((tool_entry->>'latency_ms')::numeric)        AS min_latency_ms,
      MAX((tool_entry->>'latency_ms')::numeric)        AS max_latency_ms
    FROM traces,
         jsonb_array_elements(data->'tools_called') AS tool_entry
    WHERE event = 'turn_end'
      AND created_at > NOW() - ${interval}::interval
    GROUP BY tool_entry->>'tool'
    ORDER BY call_count DESC
  `;

  // ── 3. Recent turns (last 50) ─────────────────────────────────────────────
  const recentTurns = await sql`
    SELECT
      trace_id,
      data->>'userId'              AS user_id,
      data->>'sessionId'           AS session_id,
      (data->>'total_latency_ms')::int  AS total_latency_ms,
      (data->>'steps')::int             AS steps,
      (data->>'total_tokens')::int      AS total_tokens,
      (data->>'estimated_cost_usd')::float AS estimated_cost_usd,
      data->'tools_called'              AS tools_called,
      created_at
    FROM traces
    WHERE event = 'turn_end'
    ORDER BY created_at DESC
    LIMIT 50
  `;

  // ── 4. Recent circuit-breaker fires ──────────────────────────────────────
  const recentBreakers = await sql`
    SELECT
      trace_id,
      data->>'step'             AS step,
      data->'tools_this_turn'   AS tools_this_turn,
      created_at
    FROM traces
    WHERE event = 'circuit_breaker'
    ORDER BY created_at DESC
    LIMIT 20
  `;

  // ── 5. Recent tool errors ─────────────────────────────────────────────────
  const recentErrors = await sql`
    SELECT
      trace_id,
      data->>'tool'             AS tool,
      data->>'error'            AS error,
      created_at
    FROM traces
    WHERE event = 'tool_error'
    ORDER BY created_at DESC
    LIMIT 20
  `;

  return Response.json({
    summary: {
      ...summaryRows[0],
      circuit_breaker_count: Number(circuitBreakerCount[0]?.count ?? 0),
      curated_hit_count: Number(curatedHitCount[0]?.count ?? 0),
    },
    toolStats,
    recentTurns,
    recentBreakers,
    recentErrors,
    range,
  });
}
