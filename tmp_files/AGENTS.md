# AGENTS.md — Octaraa Samaira

## Stack
- Next.js 15 App Router, TypeScript strict. Vercel AI SDK v5 (streaming + typed tools).
- Gemini for ALL AI: chat = Gemini 3 Flash (fallback 2.5 Flash), classifier = Flash-Lite, embeddings = Gemini embedding model. One API key.
- All Gemini calls go through lib/model.ts (chat/classify/embed, per-task model, env-configured). Never import the Gemini SDK elsewhere.
- Postgres + pgvector. All DB access through one pooled client in lib/db.ts (serverless-friendly driver). HNSW index on embeddings.
- Zod for all validation. Deploy: Vercel.

## Scalability rules (hard requirements)
- Stateless handlers: no session/profile/conversation state in memory; all state in Postgres, scoped by user_id/session_id.
- Pooled DB connections only — never one connection per request.
- Every model call wrapped in retry+backoff+jitter behind a concurrency limiter; all limits/top-k/timeouts from env, not literals.
- Cache embeddings by content hash; cache hot retrievals and competitor lookups.
- KB ingestion is a standalone idempotent script (content-hash upserts), never on the request path.
- Tools live in a registry; adding a tool or KB requires no orchestrator changes.
- Stream all chat responses. Index hot query paths; paginate history.
- Structured PII-redacted logging; per-session token/cost metering; trace tool calls, retrievals, guardrail trips, rate-limit hits.

## Compliance rules (non-negotiable)
- NEVER emit guaranteed/assured/risk-free return language in output or seed data.
- ADVICE_MODE env (educational|ria), default educational. In educational mode: category-level illustrative strategy only, never specific schemes/stocks, always with a disclaimer + human-advisor handoff.
- Octaraa feature claims come from the octaraa KB; competitor claims from competitor_matrix (dated). No hardcoded marketing facts; no memory-only claims.
- Financial PII encrypted at rest, never logged/stored plaintext. Profiling requires explicit consent. First assistant message discloses Samaira is an AI assistant.

## Conventions
- Guardrails (lib/guardrails.ts) wrap every turn: input filter -> generate -> output filter. Never bypass.
- App Router route handlers; stream responses.
- Tests required for guardrails and the strategy engine before any feature merges.

## Working method
- Build milestone by milestone (see octaraa-samaira-build-spec.md §13).
- Produce implementation_plan.md per milestone and wait for approval before executing.
- After executing: run typecheck + lint + tests, verify (browser screenshots for UI), produce walkthrough.md, then stop.
- Do not skip M1 (guardrails) to reach features faster. Do not batch milestones.
