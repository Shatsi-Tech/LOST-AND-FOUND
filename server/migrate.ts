import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env.DATABASE_URL || process.argv[2];

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable or command line argument is missing!');
  console.log('Please run the command as:');
  console.log('  npx tsx server/migrate.ts "postgresql://postgres:[YOUR-PASSWORD]@db.mtippitqxzyydjnnpfas.supabase.co:5432/postgres"');
  process.exit(1);
}

async function migrate() {
  console.log('🔄 Connecting to Supabase (PostgreSQL) database...');
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!');

    const schemaPath = path.resolve(__dirname, 'supabase_schema.sql');
    console.log(`📖 Reading schema file from: ${schemaPath}`);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🚀 Running database migrations (creating tables, constraints, indexes)...');
    await client.query(sql);

    console.log('🎉 Supabase database schema migration completed successfully!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message || err);
  } finally {
    await client.end();
  }
}

migrate();
