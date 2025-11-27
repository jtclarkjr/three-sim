import type { Product, Robot } from './types'

const STORE_WIDTH = 250
const STORE_HEIGHT = 150

export const generateProducts = (count: number): Product[] => {
  const products: Product[] = []

  // storefloor-style layout: multiple aisles with shelving units
  const numAisles = AISLE_CONFIG.count // Fewer aisles to fit wider spacing
  const aisleWidth = 6 // Width of narrow shelf aisle
  const productsPerAisle = Math.floor(count / (numAisles * 2))

  let productId = 0

  for (let aisle = 0; aisle < numAisles; aisle++) {
    const aisleX = getAisleCenterX(aisle)

    // Left side shelves
    for (let i = 0; i < productsPerAisle; i++) {
      if (productId >= count) break

      products.push({
        id: `product-${productId++}`,
        x: aisleX - aisleWidth / 2 + (Math.random() - 0.5) * 1.5,
        y:
          -STORE_HEIGHT / 2 +
          15 +
          (i / productsPerAisle) * (STORE_HEIGHT - 30) +
          (Math.random() - 0.5) * 2
      })
    }

    // Right side shelves
    for (let i = 0; i < productsPerAisle; i++) {
      if (productId >= count) break

      products.push({
        id: `product-${productId++}`,
        x: aisleX + aisleWidth / 2 + (Math.random() - 0.5) * 1.5,
        y:
          -STORE_HEIGHT / 2 +
          15 +
          (i / productsPerAisle) * (STORE_HEIGHT - 30) +
          (Math.random() - 0.5) * 2
      })
    }
  }

  // Fill remaining products randomly in warehouse section
  while (productId < count) {
    products.push({
      id: `product-${productId++}`,
      x: Math.random() * STORE_WIDTH - STORE_WIDTH / 2,
      y: Math.random() * STORE_HEIGHT - STORE_HEIGHT / 2
    })
  }

  return products
}

export const generateRobots = (count: number): Robot[] => {
  const robots: Robot[] = []
  const robotNames = [
    'WALL-E',
    'EVE',
    'BB-8',
    'R2-D2',
    'C-3PO',
    'Rosie',
    'Bender',
    'T-800',
    'Data',
    'GERTY'
  ]

  // Robots start in wide cross-aisles between shelf pairs
  const numAisles = 9
  const aisleSpacing = 30
  const variants: Robot['variant'][] = ['walking', 'tracked', 'dome']

  for (let i = 0; i < count; i++) {
    // Start robots at top or bottom edge
    const startAtTop = Math.random() > 0.5
    const betweenAisleNum = Math.floor(Math.random() * (numAisles - 1))
    const aisleX = -STORE_WIDTH / 2 + 20 + betweenAisleNum * aisleSpacing
    const nextAisleX =
      -STORE_WIDTH / 2 + 20 + (betweenAisleNum + 1) * aisleSpacing
    const x = (aisleX + nextAisleX) / 2 // Center of wide cross-aisle
    const y = startAtTop ? STORE_HEIGHT / 2 - 10 : -STORE_HEIGHT / 2 + 10

    // Destination at opposite end in another wide cross-aisle
    const destBetweenAisleNum = Math.floor(Math.random() * (numAisles - 1))
    const destAisleX =
      -STORE_WIDTH / 2 + 20 + destBetweenAisleNum * aisleSpacing
    const destNextAisleX =
      -STORE_WIDTH / 2 + 20 + (destBetweenAisleNum + 1) * aisleSpacing
    const destX = (destAisleX + destNextAisleX) / 2
    const destY = startAtTop ? -STORE_HEIGHT / 2 + 10 : STORE_HEIGHT / 2 - 10

    robots.push({
      id: `robot-${i}`,
      name: `${robotNames[i % robotNames.length]}-${Math.floor(i / robotNames.length) + 1}`,
      variant: variants[i % variants.length],
      x,
      y,
      orientation: Math.random() * Math.PI * 2,
      speed: 2 + Math.random() * 3,
      destX,
      destY
    })
  }

  return robots
}

export const STORE_BOUNDS = {
  width: STORE_WIDTH,
  height: STORE_HEIGHT
}

export const AISLE_CONFIG = {
  count: 6,
  spacing: 40,
  startX: -STORE_WIDTH / 2 + 20
}

export const getAisleCenterX = (aisleIndex: number) =>
  AISLE_CONFIG.startX + aisleIndex * AISLE_CONFIG.spacing
