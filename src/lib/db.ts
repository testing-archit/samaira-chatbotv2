import { neon } from '@neondatabase/serverless';
import { config } from './config';

// Use Neon's HTTP serverless driver
// This driver uses standard fetch and does not suffer from TCP connection exhaustion
// making it ideal for Next.js Server Actions and API Routes.
export const sql = neon(config.DATABASE_URL);
