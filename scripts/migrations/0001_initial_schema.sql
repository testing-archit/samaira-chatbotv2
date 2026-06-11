CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  consent_profiling BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT,
  tool_calls JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS messages_session_id_created_at_idx ON messages(session_id, created_at);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  dependents_count INT,
  earning_members INT,
  family_monthly_income_enc BYTEA,
  monthly_surplus_enc BYTEA,
  liabilities_enc BYTEA,
  emergency_fund_months INT,
  has_term_insurance BOOLEAN,
  term_cover_enc BYTEA,
  has_health_insurance BOOLEAN,
  risk_appetite TEXT,
  tax_regime TEXT,
  age INT,
  goals JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id TEXT PRIMARY KEY,
  kb TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT UNIQUE NOT NULL,
  embedding vector(1536),
  status TEXT DEFAULT 'live',
  source_url TEXT,
  title TEXT,
  as_of DATE
);

CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS competitor_matrix (
  id TEXT PRIMARY KEY,
  competitor TEXT NOT NULL,
  dimension TEXT NOT NULL,
  value TEXT,
  octaraa_value TEXT,
  octaraa_advantage TEXT,
  source_url TEXT,
  as_of DATE
);
