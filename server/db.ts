/**
 * Database abstraction layer over Supabase HTTP RPC.
 *
 * Why HTTPS instead of direct PostgreSQL TCP?
 * Direct PostgreSQL TCP connections on Supabase (db.PROJECT.supabase.co) resolve
 * exclusively to IPv6 addresses. Serverless environments like Vercel Functions
 * run in IPv4-only networks and fail with ENOTFOUND / connection timeouts.
 *
 * This layer uses @supabase/supabase-js with your service_role key to invoke the
 * `exec_sql` RPC function over regular HTTPS (which resolves via IPv4 Cloudflare CDN),
 * providing 100% reliability on Vercel while preserving the exact same db API
 * (db.query, db.queryOne, db.run, db.prepare, db.exec).
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://tdtzkeprsqltltrknuzo.supabase.co';

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkdHprZXByc3FsdGx0cmtudXpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzg3NTM4MSwiZXhwIjoyMTAzNDUxMzgxfQ.NgyJoUJzEBlBDVIP2WiZnBopjoFY9tDNhvVqZdGGaSY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Escapes a JS value for safe embedding into PostgreSQL SQL strings.
 */
export function escapeLiteral(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isFinite(val) ? String(val) : 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (val instanceof Date) return `'${val.toISOString()}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Transforms SQLite dialect into PostgreSQL dialect and interpolates parameters
 * in a single pass so values (like bcrypt hashes starting with $2a$...) do not
 * collide with parameter placeholders ($2).
 */
export function convertAndInterpolateSql(sql: string, params: any[] = []): string {
  let converted = sql;

  converted = converted.replace(/datetime\('now',\s*'-?(\d+)\s*days?'\)/gi, "NOW() - INTERVAL '$1 days'");
  converted = converted.replace(/datetime\('now',\s*'\+?(\d+)\s*days?'\)/gi, "NOW() + INTERVAL '$1 days'");
  converted = converted.replace(/datetime\('now'\)/gi, 'NOW()');
  converted = converted.replace(/datetime\("now"\)/gi, 'NOW()');
  converted = converted.replace(
    /julianday\(["']now["']\)\s*-\s*julianday\(([^)]+)\)/gi,
    'EXTRACT(DAY FROM (NOW() - $1))',
  );

  // Single-pass replacement to avoid recursive/subsequent interpolation hazards
  if (converted.includes('?')) {
    let pIdx = 0;
    converted = converted.replace(/\?/g, () => {
      const val = params[pIdx++];
      return escapeLiteral(val);
    });
  } else {
    converted = converted.replace(/\$(\d+)/g, (match, num) => {
      const idx = parseInt(num, 10) - 1;
      return escapeLiteral(params[idx]);
    });
  }

  return converted;
}

/**
 * Executes raw SQL against Supabase via the exec_sql RPC function.
 */
async function rpcExecSql(sql: string, params: any[] = []): Promise<any> {
  const finalQuery = convertAndInterpolateSql(sql, params);

  const { data, error } = await supabase.rpc('exec_sql', {
    query_text: finalQuery,
  });

  if (error) {
    console.error('[db] Supabase RPC error:', error.message, '| Query:', finalQuery);
    throw new Error(error.message);
  }

  return data;
}

export const db = {
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await rpcExecSql(sql, params);
    return Array.isArray(result) ? (result as T[]) : [];
  },

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const rows = await db.query<T>(sql, params);
    return rows[0];
  },

  async run(sql: string, params: any[] = []): Promise<{ changes: number }> {
    const result = await rpcExecSql(sql, params);
    if (result && typeof result === 'object' && 'rowCount' in result) {
      return { changes: Number(result.rowCount) || 0 };
    }
    return { changes: 0 };
  },

  async exec(sql: string): Promise<void> {
    await rpcExecSql(sql);
  },

  prepare(sql: string) {
    return {
      async run(...args: any[]) {
        const flat = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        return db.run(sql, flat);
      },
      async get(...args: any[]) {
        const flat = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        return db.queryOne(sql, flat);
      },
      async all(...args: any[]) {
        const flat = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        return db.query(sql, flat);
      },
    };
  },
};

export async function initDatabase() {
  // Database schema is already initialized in Supabase
}

export const pool = {
  query: (sql: string, params?: any[]) => db.query(sql, params),
  end: async () => {},
};
