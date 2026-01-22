import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as schema from './schema'

type SqliteStatement = {
  all?: () => Array<{ name?: string }>
  get?: () => { name?: string } | undefined
  run?: () => unknown
}

type SqliteLike = {
  exec?: (sql: string) => void
  prepare?: (sql: string) => SqliteStatement
  query?: (sql: string) => SqliteStatement
  run?: (sql: string) => unknown
}

const ensureSchema = (sqlite: SqliteLike) => {
  const runSql = (sql: string) => {
    if (sqlite.run) {
      sqlite.run(sql)
      return
    }

    if (sqlite.exec) {
      sqlite.exec(sql)
      return
    }

    if (sqlite.prepare) {
      sqlite.prepare(sql).run?.()
      return
    }

    if (sqlite.query) {
      sqlite.query(sql).run?.()
      return
    }

    throw new Error('SQLite driver does not support executing SQL')
  }

  const getTableColumns = (tableName: string) => {
    const pragma = `PRAGMA table_info(${tableName})`
    let rows: Array<{ name?: string } | undefined> = []

    if (sqlite.prepare) {
      const stmt = sqlite.prepare(pragma)
      rows = stmt.all?.() ?? (stmt.get ? [stmt.get()].filter(Boolean) : [])
    } else if (sqlite.query) {
      const stmt = sqlite.query(pragma)
      rows = stmt.all?.() ?? []
    }

    return new Set(
      rows
        .filter((row): row is { name?: string } => row !== undefined)
        .map((row) => row.name)
        .filter(Boolean)
    )
  }

  runSql(
    `CREATE TABLE IF NOT EXISTS simulation_config (
      id integer PRIMARY KEY DEFAULT 1 NOT NULL,
      product_count integer DEFAULT 20000 NOT NULL,
      robot_count integer DEFAULT 30 NOT NULL,
      tracked_robot_id text,
      pickup_product_id text,
      drop_row integer DEFAULT 1,
      drop_progress integer DEFAULT 50,
      row_count integer DEFAULT 6,
      row_spacing real DEFAULT 40,
      row_thickness real DEFAULT 6,
      start_offset real DEFAULT 20,
      walkway_width real DEFAULT 10,
      cross_row_buffer real DEFAULT 4,
      outer_walkway_offset real DEFAULT 12,
      store_width real DEFAULT 250,
      store_height real DEFAULT 150,
      orientation text DEFAULT 'vertical',
      updated_at integer DEFAULT (unixepoch()) NOT NULL
    );`
  )

  runSql(
    `CREATE TABLE IF NOT EXISTS products (
      id text PRIMARY KEY NOT NULL,
      x real NOT NULL,
      y real NOT NULL,
      created_at integer DEFAULT (unixepoch()) NOT NULL
    );`
  )

  const existingColumns = getTableColumns('simulation_config')
  const columnsToEnsure = [
    'product_count integer DEFAULT 20000 NOT NULL',
    'robot_count integer DEFAULT 30 NOT NULL',
    'tracked_robot_id text',
    'pickup_product_id text',
    'drop_row integer DEFAULT 1',
    'drop_progress integer DEFAULT 50',
    'row_count integer DEFAULT 6',
    'row_spacing real DEFAULT 40',
    'row_thickness real DEFAULT 6',
    'start_offset real DEFAULT 20',
    'walkway_width real DEFAULT 10',
    'cross_row_buffer real DEFAULT 4',
    'outer_walkway_offset real DEFAULT 12',
    'store_width real DEFAULT 250',
    'store_height real DEFAULT 150',
    "orientation text DEFAULT 'vertical'",
    'updated_at integer DEFAULT (unixepoch()) NOT NULL'
  ]

  const hasLegacyAisle = existingColumns.has('aisle_count')
  const hasLegacyDrop = existingColumns.has('drop_aisle')
  const hasLegacyCross = existingColumns.has('cross_aisle_buffer')
  const hasLegacyRowWidth = existingColumns.has('row_width')

  for (const columnDefinition of columnsToEnsure) {
    const columnName = columnDefinition.split(' ')[0]
    if (!existingColumns.has(columnName)) {
      runSql(`ALTER TABLE simulation_config ADD COLUMN ${columnDefinition};`)
    }
  }

  if (hasLegacyAisle) {
    runSql(
      'UPDATE simulation_config SET row_count = COALESCE(row_count, aisle_count);'
    )
    runSql(
      'UPDATE simulation_config SET row_spacing = COALESCE(row_spacing, aisle_spacing);'
    )
    runSql(
      'UPDATE simulation_config SET row_thickness = COALESCE(row_thickness, aisle_width);'
    )
  }

  if (hasLegacyRowWidth) {
    runSql(
      'UPDATE simulation_config SET row_thickness = COALESCE(row_thickness, row_width);'
    )
  }

  if (hasLegacyDrop) {
    runSql(
      'UPDATE simulation_config SET drop_row = COALESCE(drop_row, drop_aisle);'
    )
  }

  if (hasLegacyCross) {
    runSql(
      'UPDATE simulation_config SET cross_row_buffer = COALESCE(cross_row_buffer, cross_aisle_buffer);'
    )
  }
}

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
    ensureSchema(sqlite)
    _db = drizzle(sqlite, { schema })
  } else {
    // Use better-sqlite3 when running in Node.js (Vite dev server)
    const Database = (await import('better-sqlite3')).default
    const { drizzle } = await import('drizzle-orm/better-sqlite3')
    const sqlite = new Database(dbPath)
    ensureSchema(sqlite)
    _db = drizzle(sqlite, { schema })
  }

  if (!_db) {
    throw new Error('Database initialization failed')
  }

  return _db
}

// For backward compatibility, export a default db (lazy loaded)
export const db = await getDb()
