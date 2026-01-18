export interface Product {
  id: string
  x: number
  y: number
}

export interface Robot {
  id: string
  name: string
  variant: 'walking' | 'tracked' | 'dome'
  x: number
  y: number
  orientation: number // in radians
  speed: number
  destX: number
  destY: number
  lastMoveTime?: number // Track last time robot moved
  carryingProductId?: string
  task?: RobotTask
}

export type RobotTaskPhase = 'toProduct' | 'toDropoff'

export interface RobotTask {
  id: string
  robotId: string
  productId: string
  dropTarget: { x: number; y: number }
  phase: RobotTaskPhase
  issuedAt: number
  waypoints?: { x: number; y: number }[]
  waypointIndex?: number
  waypointsTarget?: string
}

export interface RowConfig {
  count: number
  spacing: number
  thickness: number
  startOffset: number
  walkwayWidth: number
  crossRowBuffer: number
  outerWalkwayOffset: number
  storeWidth: number
  storeHeight: number
  orientation: 'vertical' | 'horizontal'
}

export const DEFAULT_ROW_CONFIG: RowConfig = {
  count: 6,
  spacing: 40,
  thickness: 6,
  startOffset: 20,
  walkwayWidth: 10,
  crossRowBuffer: 4,
  outerWalkwayOffset: 12,
  storeWidth: 250,
  storeHeight: 150,
  orientation: 'vertical'
}

export const ROW_CONFIG_CONSTRAINTS = {
  count: { min: 1, max: 12 },
  spacing: { min: 20, max: 60 },
  thickness: { min: 2, max: 12 },
  startOffset: { min: 10, max: 30 },
  walkwayWidth: { min: 8, max: 15 },
  crossRowBuffer: { min: 2, max: 6 },
  outerWalkwayOffset: { min: 10, max: 20 },
  storeWidth: { min: 150, max: 600 },
  storeHeight: { min: 100, max: 400 }
}

export function calculateRequiredStoreWidth(config: RowConfig): number {
  // Total span from left edge of first row to right edge of last row
  // = (count - 1) * spacing + thickness
  // Plus margins on both sides: 2 * startOffset
  return (
    (config.count - 1) * config.spacing +
    config.thickness +
    2 * config.startOffset
  )
}

export function willRowsFit(config: RowConfig): boolean {
  const requiredWidth = calculateRequiredStoreWidth(config)
  return requiredWidth <= config.storeWidth
}

export function validateAndAdjustRowConfig(config: RowConfig): RowConfig {
  const validated = { ...config }

  // Calculate required width for rows
  const requiredWidth = calculateRequiredStoreWidth(config)

  // If rows don't fit, expand store width
  if (requiredWidth > config.storeWidth) {
    validated.storeWidth = Math.min(
      Math.ceil(requiredWidth / 10) * 10,
      ROW_CONFIG_CONSTRAINTS.storeWidth.max
    )
  }

  // Calculate required height (ensure walkways fit)
  const requiredHeight = 2 * config.walkwayWidth + 30
  if (requiredHeight > config.storeHeight) {
    validated.storeHeight = Math.max(
      requiredHeight,
      ROW_CONFIG_CONSTRAINTS.storeHeight.min
    )
  }

  // Clamp all values to constraints
  validated.count = Math.min(
    Math.max(validated.count, ROW_CONFIG_CONSTRAINTS.count.min),
    ROW_CONFIG_CONSTRAINTS.count.max
  )
  validated.spacing = Math.min(
    Math.max(validated.spacing, ROW_CONFIG_CONSTRAINTS.spacing.min),
    ROW_CONFIG_CONSTRAINTS.spacing.max
  )
  validated.thickness = Math.min(
    Math.max(validated.thickness, ROW_CONFIG_CONSTRAINTS.thickness.min),
    ROW_CONFIG_CONSTRAINTS.thickness.max
  )
  validated.storeWidth = Math.min(
    Math.max(validated.storeWidth, ROW_CONFIG_CONSTRAINTS.storeWidth.min),
    ROW_CONFIG_CONSTRAINTS.storeWidth.max
  )
  validated.storeHeight = Math.min(
    Math.max(validated.storeHeight, ROW_CONFIG_CONSTRAINTS.storeHeight.min),
    ROW_CONFIG_CONSTRAINTS.storeHeight.max
  )

  return validated
}
