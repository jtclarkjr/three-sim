import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as schema from './schema'

const dbPath = process.env.DATABASE_URL || 'sqlite.db'

// Lazy initialize database with runtime detection
type DbInstance = BaseSQLiteDatabase<'sync', unknown, typeof schema>
let _db: DbInstance | undefined

export const getDb = async (): Promise<DbInstance> => {
  if (_db) return _db

  const isBun = typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined'

  if (isBun) {
    // Use bun:sqlite when running in Bun
    const { Database } = await import('bun:sqlite')
    const { drizzle } = await import('drizzle-orm/bun-sqlite')
    const sqlite = new Database(dbPath)
    _db = drizzle(sqlite, { schema })
  } else {
    // Use better-sqlite3 when running in Node.js (Vite dev server)
    const Database = (await import('better-sqlite3')).default
    const { drizzle } = await import('drizzle-orm/better-sqlite3')
    const sqlite = new Database(dbPath)
    _db = drizzle(sqlite, { schema })
  }

  if (!_db) {
    throw new Error('Database initialization failed')
  }

  return _db
}

// For backward compatibility, export a default db (lazy loaded)
export const db = await getDb()
