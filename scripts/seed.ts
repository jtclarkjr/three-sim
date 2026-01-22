import { db } from '../src/db'
import { simulationConfig, products } from '../src/db/schema'
import { generateProducts } from '../src/components/store-map/mockData'

async function main() {
  console.log('Seeding database...')

  const defaultProductCount = 20000
  const defaultRobotCount = 30

  await db
    .insert(simulationConfig)
    .values({
      id: 1,
      productCount: defaultProductCount,
      robotCount: defaultRobotCount,
      trackedRobotId: 'robot-0',
      pickupProductId: 'product-0',
      dropRow: 1,
      dropProgress: 50
    })
    .onConflictDoUpdate({
      target: simulationConfig.id,
      set: {
        productCount: defaultProductCount,
        robotCount: defaultRobotCount,
        trackedRobotId: 'robot-0',
        pickupProductId: 'product-0',
        dropRow: 1,
        dropProgress: 50
      }
    })

  console.log(`Generating ${defaultProductCount} products...`)
  const productList = generateProducts(defaultProductCount)

  console.log('Clearing existing products...')
  await db.delete(products)

  console.log('Inserting products...')
  const CHUNK_SIZE = 100
  for (let i = 0; i < productList.length; i += CHUNK_SIZE) {
    const chunk = productList.slice(i, i + CHUNK_SIZE)
    await db.insert(products).values(
      chunk.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y
      }))
    )

    if (i % 1000 === 0) {
      console.log(`Inserted ${i} products...`)
    }
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
