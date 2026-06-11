ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS content_fts tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX IF NOT EXISTS knowledge_chunks_fts_idx ON knowledge_chunks USING GIN (content_fts);
