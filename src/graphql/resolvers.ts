import type { Product } from '@/components/store-map/types'

// Lazy load database to avoid bun:sqlite import errors in Vite
async function getDb() {
  const { db } = await import('@/db')
  const { products, simulationConfig } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')
  return { db, products, simulationConfig, eq }
}

export const resolvers = {
  Query: {
    async simulationConfig() {
      const { db, simulationConfig, eq } = await getDb()
      const config = await db
        .select()
        .from(simulationConfig)
        .where(eq(simulationConfig.id, 1))
        .limit(1)

      return config[0] || null
    },

    async products() {
      const { db, products } = await getDb()
      return await db.select().from(products).orderBy(products.id)
    },

    async productCount() {
      const { db, products } = await getDb()
      const result = await db.select({ count: products.id }).from(products)
      return result.length
    }
  },

  Mutation: {
    async saveSimulation(
      _parent: unknown,
      args: {
        input: {
          productCount: number
          robotCount: number
          trackedRobotId?: string | null
          pickupProductId?: string | null
          dropAisle?: number | null
          dropProgress?: number | null
          aisleCount?: number | null
          aisleSpacing?: number | null
          aisleWidth?: number | null
          startOffset?: number | null
          walkwayWidth?: number | null
          crossAisleBuffer?: number | null
          outerWalkwayOffset?: number | null
          storeWidth?: number | null
          storeHeight?: number | null
          orientation?: string | null
          products: Product[]
        }
      }
    ) {
      const {
        productCount,
        robotCount,
        trackedRobotId,
        pickupProductId,
        dropAisle,
        dropProgress,
        aisleCount,
        aisleSpacing,
        aisleWidth,
        startOffset,
        walkwayWidth,
        crossAisleBuffer,
        outerWalkwayOffset,
        storeWidth,
        storeHeight,
        orientation,
        products: productList
      } = args.input

      if (productCount < 0 || robotCount < 0) {
        return {
          success: false,
          message: 'Counts must be non-negative'
        }
      }

      if (productList.length !== productCount) {
        return {
          success: false,
          message: `Product array length (${productList.length}) must match productCount (${productCount})`
        }
      }

      try {
        const { db, products, simulationConfig, eq } = await getDb()

        await db.transaction((tx) => {
          const existingConfig = tx
            .select()
            .from(simulationConfig)
            .where(eq(simulationConfig.id, 1))
            .limit(1)

          if (existingConfig.length > 0) {
            tx
              .update(simulationConfig)
              .set({
                productCount,
                robotCount,
                trackedRobotId,
                pickupProductId,
                dropAisle,
                dropProgress,
                aisleCount,
                aisleSpacing,
                aisleWidth,
                startOffset,
                walkwayWidth,
                crossAisleBuffer,
                outerWalkwayOffset,
                storeWidth,
                storeHeight,
                orientation
              })
              .where(eq(simulationConfig.id, 1))
          } else {
            tx.insert(simulationConfig).values({
              id: 1,
              productCount,
              robotCount,
              trackedRobotId,
              pickupProductId,
              dropAisle,
              dropProgress,
              aisleCount,
              aisleSpacing,
              aisleWidth,
              startOffset,
              walkwayWidth,
              crossAisleBuffer,
              outerWalkwayOffset,
              storeWidth,
              storeHeight,
              orientation
            })
          }

          tx.delete(products)

          const CHUNK_SIZE = 100
          for (let i = 0; i < productList.length; i += CHUNK_SIZE) {
            const chunk = productList.slice(i, i + CHUNK_SIZE)
            tx.insert(products).values(
              chunk.map((p) => ({
                id: p.id,
                x: p.x,
                y: p.y
              }))
            )
          }
        })

        const config = await db
          .select()
          .from(simulationConfig)
          .where(eq(simulationConfig.id, 1))
          .limit(1)

        return {
          success: true,
          message: `Saved ${productCount} products and ${robotCount} robots`,
          config: config[0]
        }
      } catch (error) {
        return {
          success: false,
          message: `Error saving simulation: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    },

    async resetSimulation() {
      try {
        const { db, products, simulationConfig } = await getDb()

        await db.transaction(async (tx) => {
          await tx.delete(products)
          await tx.delete(simulationConfig)
        })

        return {
          success: true,
          message: 'Simulation reset to defaults'
        }
      } catch (error) {
        return {
          success: false,
          message: `Error resetting simulation: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }
  }
}
