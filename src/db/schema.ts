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
  aisleCount: integer('aisle_count').default(6),
  aisleSpacing: real('aisle_spacing').default(40),
  aisleWidth: real('aisle_width').default(6),
  startOffset: real('start_offset').default(20),
  walkwayWidth: real('walkway_width').default(10),
  crossAisleBuffer: real('cross_aisle_buffer').default(4),
  outerWalkwayOffset: real('outer_walkway_offset').default(12),
  storeWidth: real('store_width').default(250),
  storeHeight: real('store_height').default(150),
  orientation: text('orientation').default('vertical'),
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
