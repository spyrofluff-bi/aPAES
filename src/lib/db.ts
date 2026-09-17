import { Pool } from 'pg';

const dev = process.env.NODE_ENV === 'development';
export const log = (...args: any[]) => { if (dev) console.log('[DB]', ...args); };

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

if (!global._pgPool) {
  const connString = process.env.POSTGRES_URL_NON_POOLING;
  if (!connString) {
    // At build time the env var may not be present — skip pool creation.
    // The pool will be created on first runtime request.
  } else {
    log('Creating pool →', process.env.POSTGRES_HOST);
    const cleaned = connString.replace(/[?&]sslmode=[^&]*/g, '');
    global._pgPool = new Pool({
      connectionString: cleaned,
      ssl: { rejectUnauthorized: false },
    });
    global._pgPool.on('connect', () => log('Connected'));
    global._pgPool.on('error', (err) => console.error('[DB] Pool error:', err));
  }
}

export const pool = global._pgPool as Pool;

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  // Lazy-init pool if it wasn't created at module load (e.g. env var set after boot)
  if (!global._pgPool) {
    const connString = process.env.POSTGRES_URL_NON_POOLING;
    if (!connString) throw new Error('POSTGRES_URL_NON_POOLING is not set');
    const cleaned = connString.replace(/[?&]sslmode=[^&]*/g, '');
    global._pgPool = new Pool({
      connectionString: cleaned,
      ssl: { rejectUnauthorized: false },
    });
    global._pgPool.on('connect', () => log('Connected'));
    global._pgPool.on('error', (err) => console.error('[DB] Pool error:', err));
  }
  log(sql.trim().split('\n')[0], params ?? '');
  const { rows } = await global._pgPool.query(sql, params);
  return rows;
}
