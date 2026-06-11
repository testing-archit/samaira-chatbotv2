import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().default('postgres://postgres:postgres@localhost:5432/octaraa'),
  GEMINI_API_KEY: z.string().min(1).default('dummy_key_for_build'),
  OPENROUTER_API_KEY: z.string().min(1).default('dummy_openrouter_key'),
  ADVICE_MODE: z.enum(['educational', 'ria']).default('educational'),
  MAX_CONCURRENCY: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_RETRIES: z.coerce.number().int().nonnegative().default(3),
  ENCRYPTION_KEY: z.string().length(64).default('0000000000000000000000000000000000000000000000000000000000000000'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const config = parsedEnv.data;
