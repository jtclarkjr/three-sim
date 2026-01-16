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

export interface AisleConfig {
  count: number
  spacing: number
  width: number
  startOffset: number
  walkwayWidth: number
  crossAisleBuffer: number
  outerWalkwayOffset: number
  storeWidth: number
  storeHeight: number
  orientation: 'vertical' | 'horizontal'
}

export const DEFAULT_AISLE_CONFIG: AisleConfig = {
  count: 6,
  spacing: 40,
  width: 6,
  startOffset: 20,
  walkwayWidth: 10,
  crossAisleBuffer: 4,
  outerWalkwayOffset: 12,
  storeWidth: 250,
  storeHeight: 150,
  orientation: 'vertical'
}

export const AISLE_CONFIG_CONSTRAINTS = {
  count: { min: 1, max: 12 },
  spacing: { min: 20, max: 60 },
  width: { min: 4, max: 10 },
  startOffset: { min: 10, max: 30 },
  walkwayWidth: { min: 8, max: 15 },
  crossAisleBuffer: { min: 2, max: 6 },
  outerWalkwayOffset: { min: 10, max: 20 },
  storeWidth: { min: 150, max: 600 },
  storeHeight: { min: 100, max: 400 }
}

export function calculateRequiredStoreWidth(config: AisleConfig): number {
  // Total span from left edge of first aisle to right edge of last aisle
  // = (count - 1) * spacing + width
  // Plus margins on both sides: 2 * startOffset
  return (
    (config.count - 1) * config.spacing + config.width + 2 * config.startOffset
  )
}

export function willAislesFit(config: AisleConfig): boolean {
  const requiredWidth = calculateRequiredStoreWidth(config)
  return requiredWidth <= config.storeWidth
}

export function validateAndAdjustAisleConfig(config: AisleConfig): AisleConfig {
  const validated = { ...config }

  // Calculate required width for aisles
  const requiredWidth = calculateRequiredStoreWidth(config)

  // If aisles don't fit, expand store width
  if (requiredWidth > config.storeWidth) {
    validated.storeWidth = Math.min(
      Math.ceil(requiredWidth / 10) * 10,
      AISLE_CONFIG_CONSTRAINTS.storeWidth.max
    )
  }

  // Calculate required height (ensure walkways fit)
  const requiredHeight = 2 * config.walkwayWidth + 30
  if (requiredHeight > config.storeHeight) {
    validated.storeHeight = Math.max(
      requiredHeight,
      AISLE_CONFIG_CONSTRAINTS.storeHeight.min
    )
  }

  // Clamp all values to constraints
  validated.count = Math.min(
    Math.max(validated.count, AISLE_CONFIG_CONSTRAINTS.count.min),
    AISLE_CONFIG_CONSTRAINTS.count.max
  )
  validated.spacing = Math.min(
    Math.max(validated.spacing, AISLE_CONFIG_CONSTRAINTS.spacing.min),
    AISLE_CONFIG_CONSTRAINTS.spacing.max
  )
  validated.width = Math.min(
    Math.max(validated.width, AISLE_CONFIG_CONSTRAINTS.width.min),
    AISLE_CONFIG_CONSTRAINTS.width.max
  )
  validated.storeWidth = Math.min(
    Math.max(validated.storeWidth, AISLE_CONFIG_CONSTRAINTS.storeWidth.min),
    AISLE_CONFIG_CONSTRAINTS.storeWidth.max
  )
  validated.storeHeight = Math.min(
    Math.max(validated.storeHeight, AISLE_CONFIG_CONSTRAINTS.storeHeight.min),
    AISLE_CONFIG_CONSTRAINTS.storeHeight.max
  )

  return validated
}
