import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const simulationConfig = sqliteTable('simulation_config', {
  id: integer('id').primaryKey().default(1),
  productCount: integer('product_count').notNull().default(20000),
  robotCount: integer('robot_count').notNull().default(30),
  trackedRobotId: text('tracked_robot_id'),
  pickupProductId: text('pickup_product_id'),
  dropAisle: integer('drop_aisle').default(1),
  dropProgress: integer('drop_progress').default(50),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date())
})

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
})
