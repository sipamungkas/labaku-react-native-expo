import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/database/schema.ts',
  out: './lib/database/migrations',
  driver: 'expo',
  dialect: 'sqlite',
} satisfies Config;