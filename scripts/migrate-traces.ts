/**
 * Run once to create the traces table:
 *   npx tsx scripts/migrate-traces.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
if (process.env.DATABASE_URL?.startsWith('"')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^"|"$/g, '');
}

import postgres from 'postgres';

async function migrate() {
  const sql = postgres(process.env.DATABASE_URL!);
  console.log('Creating traces table...');

  await sql`
    CREATE TABLE IF NOT EXISTS traces (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      trace_id    TEXT        NOT NULL,
      event       TEXT        NOT NULL,
      data        JSONB       NOT NULL DEFAULT '{}',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS traces_trace_id_idx   ON traces (trace_id)`;
  await sql`CREATE INDEX IF NOT EXISTS traces_event_idx      ON traces (event)`;
  await sql`CREATE INDEX IF NOT EXISTS traces_created_at_idx ON traces (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS traces_user_idx       ON traces ((data->>'userId'))`;

  console.log('✅ traces table ready.');
  await sql.end();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
