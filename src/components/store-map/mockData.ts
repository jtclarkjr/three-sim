import type { Product, Robot, RowConfig } from './types'
import { DEFAULT_ROW_CONFIG } from './types'

const STORE_WIDTH = 250
const STORE_HEIGHT = 150

export function rowConfigToBuffer(config: RowConfig): Float32Array {
  return new Float32Array([
    config.storeWidth,
    config.storeHeight,
    config.count,
    config.spacing,
    config.thickness,
    config.startOffset,
    config.walkwayWidth,
    config.crossRowBuffer,
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

export function getRowCenterCoord(rowIndex: number, config: RowConfig): number {
  return -config.storeWidth / 2 + config.startOffset + rowIndex * config.spacing
}

export const generateProducts = (
  count: number,
  config: RowConfig = DEFAULT_ROW_CONFIG
): Product[] => {
  const products: Product[] = []

  // Single-line rows of products
  const basePerRow = Math.floor(count / config.count)
  const remainder = count % config.count
  let productId = 0

  for (let row = 0; row < config.count; row++) {
    const rowX = getRowCenterCoord(row, config)
    const rowProductCount = basePerRow + (row < remainder ? 1 : 0)
    if (rowProductCount <= 0) continue
    const span = config.storeHeight - 30
    const step = rowProductCount > 1 ? span / (rowProductCount - 1) : 0

    for (let i = 0; i < rowProductCount; i++) {
      if (productId >= count) break

      const pos = transformPosition(
        rowX + (Math.random() - 0.5) * (config.thickness * 0.35),
        -config.storeHeight / 2 +
          15 +
          (rowProductCount > 1 ? i * step : span / 2) +
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

  return products
}

export const MIN_ROBOT_SPEED = 2
export const MAX_ROBOT_SPEED = 5

export const generateRobots = (
  count: number,
  config: RowConfig = DEFAULT_ROW_CONFIG
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

  // Robots start in wide cross-rows between product lines
  const variants: Robot['variant'][] = ['walking', 'tracked', 'dome']
  const numWalkways = Math.max(1, config.count - 1)

  for (let i = 0; i < count; i++) {
    // Start robots at top or bottom edge
    const startAtTop = Math.random() > 0.5
    const betweenRowNum = Math.floor(Math.random() * numWalkways)
    const rowX = getRowCenterCoord(betweenRowNum, config)
    const nextRowX = getRowCenterCoord(betweenRowNum + 1, config)
    const midX = (rowX + nextRowX) / 2 // Center of wide cross-row
    const midY = startAtTop
      ? config.storeHeight / 2 - 10
      : -config.storeHeight / 2 + 10

    const pos = transformPosition(midX, midY, config.orientation)

    // Destination at opposite end in another wide cross-row
    const destBetweenRowNum = Math.floor(Math.random() * numWalkways)
    const destRowX = getRowCenterCoord(destBetweenRowNum, config)
    const destNextRowX = getRowCenterCoord(destBetweenRowNum + 1, config)
    const destMidX = (destRowX + destNextRowX) / 2
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
      speed:
        MIN_ROBOT_SPEED + Math.random() * (MAX_ROBOT_SPEED - MIN_ROBOT_SPEED),
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

export const ROW_CONFIG = {
  count: 6,
  spacing: 40,
  startX: -STORE_WIDTH / 2 + 20
}

export const getRowCenterX = (rowIndex: number) =>
  ROW_CONFIG.startX + rowIndex * ROW_CONFIG.spacing
