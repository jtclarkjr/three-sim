import type { AisleConfig, Product, Robot } from './types'
import { DEFAULT_AISLE_CONFIG } from './types'

const STORE_WIDTH = 250
const STORE_HEIGHT = 150

export function aisleConfigToBuffer(config: AisleConfig): Float32Array {
  return new Float32Array([
    config.storeWidth,
    config.storeHeight,
    config.count,
    config.spacing,
    config.width,
    config.startOffset,
    config.walkwayWidth,
    config.crossAisleBuffer,
    config.outerWalkwayOffset,
    config.orientation === 'horizontal' ? 1 : 0
  ])
}

export function transformPosition(
  x: number,
  y: number,
  orientation: 'vertical' | 'horizontal'
): { x: number; y: number } {
  return orientation === 'horizontal' ? { x: y, y: x } : { x, y }
}

export function getAisleCenterCoord(
  aisleIndex: number,
  config: AisleConfig
): number {
  return (
    -config.storeWidth / 2 + config.startOffset + aisleIndex * config.spacing
  )
}

export const generateProducts = (
  count: number,
  config: AisleConfig = DEFAULT_AISLE_CONFIG
): Product[] => {
  const products: Product[] = []

  // storefloor-style layout: multiple aisles with shelving units
  const productsPerAisle = Math.floor(count / (config.count * 2))

  let productId = 0

  for (let aisle = 0; aisle < config.count; aisle++) {
    const aisleX = getAisleCenterCoord(aisle, config)

    // Left side shelves
    for (let i = 0; i < productsPerAisle; i++) {
      if (productId >= count) break

      const pos = transformPosition(
        aisleX - config.width / 2 + (Math.random() - 0.5) * 1.5,
        -config.storeHeight / 2 +
          15 +
          (i / productsPerAisle) * (config.storeHeight - 30) +
          (Math.random() - 0.5) * 2,
        config.orientation
      )

      products.push({
        id: `product-${productId++}`,
        x: pos.x,
        y: pos.y
      })
    }

    // Right side shelves
    for (let i = 0; i < productsPerAisle; i++) {
      if (productId >= count) break

      const pos = transformPosition(
        aisleX + config.width / 2 + (Math.random() - 0.5) * 1.5,
        -config.storeHeight / 2 +
          15 +
          (i / productsPerAisle) * (config.storeHeight - 30) +
          (Math.random() - 0.5) * 2,
        config.orientation
      )

      products.push({
        id: `product-${productId++}`,
        x: pos.x,
        y: pos.y
      })
    }
  }

  // Fill remaining products randomly in warehouse section
  while (productId < count) {
    const pos = transformPosition(
      Math.random() * config.storeWidth - config.storeWidth / 2,
      Math.random() * config.storeHeight - config.storeHeight / 2,
      config.orientation
    )

    products.push({
      id: `product-${productId++}`,
      x: pos.x,
      y: pos.y
    })
  }

  return products
}

export const generateRobots = (
  count: number,
  config: AisleConfig = DEFAULT_AISLE_CONFIG
): Robot[] => {
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
  const variants: Robot['variant'][] = ['walking', 'tracked', 'dome']
  const numWalkways = Math.max(1, config.count - 1)

  for (let i = 0; i < count; i++) {
    // Start robots at top or bottom edge
    const startAtTop = Math.random() > 0.5
    const betweenAisleNum = Math.floor(Math.random() * numWalkways)
    const aisleX = getAisleCenterCoord(betweenAisleNum, config)
    const nextAisleX = getAisleCenterCoord(betweenAisleNum + 1, config)
    const midX = (aisleX + nextAisleX) / 2 // Center of wide cross-aisle
    const midY = startAtTop
      ? config.storeHeight / 2 - 10
      : -config.storeHeight / 2 + 10

    const pos = transformPosition(midX, midY, config.orientation)

    // Destination at opposite end in another wide cross-aisle
    const destBetweenAisleNum = Math.floor(Math.random() * numWalkways)
    const destAisleX = getAisleCenterCoord(destBetweenAisleNum, config)
    const destNextAisleX = getAisleCenterCoord(destBetweenAisleNum + 1, config)
    const destMidX = (destAisleX + destNextAisleX) / 2
    const destMidY = startAtTop
      ? -config.storeHeight / 2 + 10
      : config.storeHeight / 2 - 10

    const destPos = transformPosition(destMidX, destMidY, config.orientation)

    robots.push({
      id: `robot-${i}`,
      name: `${robotNames[i % robotNames.length]}-${Math.floor(i / robotNames.length) + 1}`,
      variant: variants[i % variants.length],
      x: pos.x,
      y: pos.y,
      orientation: Math.random() * Math.PI * 2,
      speed: 2 + Math.random() * 3,
      destX: destPos.x,
      destY: destPos.y
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
