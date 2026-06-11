import postgres from 'postgres';
import { config } from './config';

// Create a single pooled client.
// In Next.js dev mode, the module is reloaded repeatedly, which can exhaust DB connections.
// We attach the client to the global object to prevent this.
const globalForPostgres = global as unknown as { sql: postgres.Sql };

export const sql = globalForPostgres.sql || postgres(config.DATABASE_URL, {
  max: 10, // Max connections in the pool
  idle_timeout: 20, // Max idle time (seconds)
  connect_timeout: 10,
});

if (process.env.NODE_ENV !== 'production') {
  globalForPostgres.sql = sql;
}
