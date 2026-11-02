// One-time legacy-data ETL: MySQL (loaded from the client's mysqldump into a
// throwaway local container) -> Prisma/Postgres. Not part of the app's module
// architecture (see backend/CLAUDE.md) — run manually with ts-node, kept in the
// repo afterward as the historical record of the migration.
import mysql from 'mysql2/promise';
import prisma from '../../src/config/prisma';

export { prisma };

let pool: mysql.Pool | undefined;

export function legacyDb(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: '127.0.0.1',
      port: 33061,
      user: 'root',
      password: 'temppass',
      database: 'boundless_legacy',
      dateStrings: false,
    });
  }
  return pool;
}

export async function queryAll<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await legacyDb().query(sql, params);
  return rows as T[];
}

export async function closeAll(): Promise<void> {
  if (pool) await pool.end();
  await prisma.$disconnect();
}

// tinyint(1)/tinyint 0|1 -> boolean, tolerant of null/undefined.
export function bool(v: unknown, defaultVal = false): boolean {
  if (v === null || v === undefined) return defaultVal;
  return Number(v) === 1;
}

// Empty-string legacy text columns should become null, not ''.
export function nullIfEmpty(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const trimmed = v.trim();
  return trimmed === '' ? null : v;
}
