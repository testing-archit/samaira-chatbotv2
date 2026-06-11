import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const sql = postgres(process.env.DATABASE_URL as string, { max: 1 });

async function runMigrations() {
  console.log('Running migrations...');
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (file.endsWith('.sql')) {
      console.log(`Executing ${file}...`);
      const query = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await sql.unsafe(query);
    }
  }
  console.log('Migrations complete!');
  process.exit(0);
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
