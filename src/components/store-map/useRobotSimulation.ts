import { useEffect, useRef, useState } from 'react'
import { STORE_BOUNDS } from './mockData'
import type { Product, Robot } from './types'

const UPDATE_INTERVAL = 100 // 10 times per second
const STUCK_TIMEOUT = 3000 // If robot hasn't moved in 3 seconds, force reset

// Aisle configuration matching mockData.ts
const NUM_AISLES = 6 // Fewer aisles to fit in store
const AISLE_SPACING = 30 // Double width - matches mockData
const AISLE_WIDTH = 6 // Match mockData.ts aisle width exactly

function isInAisleWalkway(x: number, y: number): boolean {
  // Cross-aisle walkways at top and bottom (perpendicular to aisles)
  const WALKWAY_WIDTH = 10
  const topWalkwayY = STORE_BOUNDS.height / 2 - 10
  const bottomWalkwayY = -STORE_BOUNDS.height / 2 + 10

  // Wide cross-aisles between shelf pairs (perpendicular walkways)
  for (let aisle = 0; aisle < NUM_AISLES - 1; aisle++) {
    const aisleX = -STORE_BOUNDS.width / 2 + 20 + aisle * AISLE_SPACING
    const nextAisleX =
      -STORE_BOUNDS.width / 2 + 20 + (aisle + 1) * AISLE_SPACING
    const midX = (aisleX + nextAisleX) / 2
    const crossAisleWidth = AISLE_SPACING - AISLE_WIDTH - 4 // Width between shelf pairs

    if (Math.abs(x - midX) < crossAisleWidth / 2) {
      const yInBounds = Math.abs(y) < STORE_BOUNDS.height / 2 - 5
      if (yInBounds) return true
    }
  }

  // Top and bottom walkways connecting all aisles
  if (
    (Math.abs(y - topWalkwayY) < WALKWAY_WIDTH / 2 ||
      Math.abs(y - bottomWalkwayY) < WALKWAY_WIDTH / 2) &&
    Math.abs(x) < STORE_BOUNDS.width / 2 - 10
  ) {
    return true
  }

  // BLOCK narrow shelf aisles - robots should NOT go here
  return false
}

function findNearestValidPosition(
  x: number,
  y: number
): { x: number; y: number } {
  // Find the nearest aisle center
  let nearestAisleX = -STORE_BOUNDS.width / 2 + 20
  let minDist = Math.abs(x - nearestAisleX)

  for (let aisle = 1; aisle < NUM_AISLES; aisle++) {
    const aisleX = -STORE_BOUNDS.width / 2 + 20 + aisle * AISLE_SPACING
    const dist = Math.abs(x - aisleX)
    if (dist < minDist) {
      minDist = dist
      nearestAisleX = aisleX
    }
  }

  // Clamp y to valid bounds
  const clampedY = Math.max(
    -STORE_BOUNDS.height / 2 + 10,
    Math.min(STORE_BOUNDS.height / 2 - 10, y)
  )

  return { x: nearestAisleX, y: clampedY }
}

function getValidDestination(): { x: number; y: number } {
  // Generate destination in aisles or walkways
  for (let attempts = 0; attempts < 50; attempts++) {
    const useAisle = Math.random() > 0.2

    if (useAisle) {
      const aisleNum = Math.floor(Math.random() * NUM_AISLES)
      const aisleX = -STORE_BOUNDS.width / 2 + 20 + aisleNum * AISLE_SPACING
      const y =
        Math.random() * (STORE_BOUNDS.height - 30) -
        (STORE_BOUNDS.height - 30) / 2

      return { x: aisleX, y }
    } else {
      const x = Math.random() * STORE_BOUNDS.width - STORE_BOUNDS.width / 2
      const y = Math.random() * STORE_BOUNDS.height - STORE_BOUNDS.height / 2

      if (isInAisleWalkway(x, y)) {
        return { x, y }
      }
    }
  }

  // Fallback: center of a random aisle
  const aisleNum = Math.floor(Math.random() * NUM_AISLES)
  const aisleX = -STORE_BOUNDS.width / 2 + 20 + aisleNum * AISLE_SPACING
  return { x: aisleX, y: 0 }
}

const ROBOT_RADIUS = 2
const PRODUCT_RADIUS = 0.5
const COLLISION_BUFFER = 0.5
const BOUNCE_DAMPING = 0.8 // Energy retained after bounce (0-1)

function _checkRobotCollision(
  x: number,
  y: number,
  currentRobotId: string,
  allRobots: Robot[]
): boolean {
  return allRobots.some((robot) => {
    if (robot.id === currentRobotId) return false
    const dx = x - robot.x
    const dy = y - robot.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < ROBOT_RADIUS * 2 + COLLISION_BUFFER
  })
}

function checkProductCollision(
  x: number,
  y: number,
  products: Product[]
): Product | null {
  for (const product of products) {
    const dx = x - product.x
    const dy = y - product.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance < ROBOT_RADIUS + PRODUCT_RADIUS + COLLISION_BUFFER) {
      return product
    }
  }
  return null
}

function _calculateBounceVelocity(
  robotX: number,
  robotY: number,
  velocityX: number,
  velocityY: number,
  productX: number,
  productY: number
): { vx: number; vy: number } {
  // Calculate collision normal (from product to robot)
  const dx = robotX - productX
  const dy = robotY - productY
  const distance = Math.sqrt(dx * dx + dy * dy)

  // Normalize the collision normal
  const normalX = dx / distance
  const normalY = dy / distance

  // Calculate dot product of velocity and normal
  const dotProduct = velocityX * normalX + velocityY * normalY

  // Reflect velocity vector across the normal
  // v' = v - 2(v·n)n
  const reflectedVx = velocityX - 2 * dotProduct * normalX
  const reflectedVy = velocityY - 2 * dotProduct * normalY

  // Apply damping to simulate energy loss
  return {
    vx: reflectedVx * BOUNCE_DAMPING,
    vy: reflectedVy * BOUNCE_DAMPING
  }
}

export function useRobotSimulation(
  initialRobots: Robot[],
  products: Product[]
) {
  const [robots, setRobots] = useState<Robot[]>(initialRobots)
  const robotsRef = useRef<Robot[]>(initialRobots)

  useEffect(() => {
    robotsRef.current = robots
  }, [robots])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRobots((currentRobots) => {
        return currentRobots.map((robot) => {
          const currentTime = Date.now()
          const timeSinceLastMove = currentTime - (robot.lastMoveTime ?? currentTime)
          
          // Force reset if robot hasn't moved in STUCK_TIMEOUT milliseconds
          if (timeSinceLastMove > STUCK_TIMEOUT) {
            const newDest = getValidDestination()
            return {
              ...robot,
              destX: newDest.x,
              destY: newDest.y,
              lastMoveTime: currentTime
            }
          }
          
          const dx = robot.destX - robot.x
          const dy = robot.destY - robot.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 2) {
            const newDest = getValidDestination()

            return {
              ...robot,
              destX: newDest.x,
              destY: newDest.y
            }
          }

          const moveAmount = robot.speed * (UPDATE_INTERVAL / 1000)
          const moveX = (dx / distance) * moveAmount
          const moveY = (dy / distance) * moveAmount

          let newX = robot.x + moveX
          let newY = robot.y + moveY

          // Check if current position is invalid (robot is stuck on shelf)
          if (!isInAisleWalkway(robot.x, robot.y)) {
            // Robot is stuck, teleport to nearest valid position
            const validPos = findNearestValidPosition(robot.x, robot.y)
            const newDest = getValidDestination()
            return {
              ...robot,
              x: validPos.x,
              y: validPos.y,
              destX: newDest.x,
              destY: newDest.y
            }
          }

          // Check if new position is valid (not in shelf area)
          if (!isInAisleWalkway(newX, newY)) {
            // Try moving along one axis at a time
            if (isInAisleWalkway(newX, robot.y)) {
              newY = robot.y // Only move in X
            } else if (isInAisleWalkway(robot.x, newY)) {
              newX = robot.x // Only move in Y
            } else {
              // Still can't move, stay in place but pick new destination
              const newDest = getValidDestination()
              return {
                ...robot,
                destX: newDest.x,
                destY: newDest.y
              }
            }
          }

          // Check for collisions with products
          const collidedProduct = checkProductCollision(newX, newY, products)

          let newDestX = robot.destX
          let newDestY = robot.destY

          if (collidedProduct) {
            // Calculate bounce direction
            const dx = robot.x - collidedProduct.x
            const dy = robot.y - collidedProduct.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            // Normalize collision normal
            const normalX = dx / dist
            const normalY = dy / dist

            // Reflect the direction to destination across the normal
            const toDestX = robot.destX - robot.x
            const toDestY = robot.destY - robot.y
            const toDestDist = Math.sqrt(toDestX * toDestX + toDestY * toDestY)
            const toDestNormX = toDestX / toDestDist
            const toDestNormY = toDestY / toDestDist

            // Reflect destination direction using v' = v - 2(v·n)n
            const dotProduct = toDestNormX * normalX + toDestNormY * normalY
            const reflectedX = toDestNormX - 2 * dotProduct * normalX
            const reflectedY = toDestNormY - 2 * dotProduct * normalY

            // Set new destination in the bounced direction
            // Use larger bounce distance to ensure robot travels far enough
            const bounceDistance = 50
            newDestX = robot.x + reflectedX * bounceDistance
            newDestY = robot.y + reflectedY * bounceDistance

            // Clamp to store bounds and walkway areas
            newDestX = Math.max(
              -STORE_BOUNDS.width / 2 + 10,
              Math.min(STORE_BOUNDS.width / 2 - 10, newDestX)
            )
            newDestY = Math.max(
              -STORE_BOUNDS.height / 2 + 10,
              Math.min(STORE_BOUNDS.height / 2 - 10, newDestY)
            )
            
            // If bounced destination isn't in a walkway, find a valid one
            if (!isInAisleWalkway(newDestX, newDestY)) {
              const validDest = getValidDestination()
              newDestX = validDest.x
              newDestY = validDest.y
            }

            // Push robot slightly away from product
            const pushDistance =
              ROBOT_RADIUS + PRODUCT_RADIUS + COLLISION_BUFFER + 0.2
            newX = collidedProduct.x + normalX * pushDistance
            newY = collidedProduct.y + normalY * pushDistance

            // Make sure in a valid area
            if (!isInAisleWalkway(newX, newY)) {
              newX = robot.x
              newY = robot.y
              // Pick a random new destination instead
              const randomDest = getValidDestination()
              newDestX = randomDest.x
              newDestY = randomDest.y
            }
          }

          const newOrientation = Math.atan2(newX - robot.x, newY - robot.y)
          
          // Check if robot actually moved
          const hasMoved = Math.abs(newX - robot.x) > 0.01 || Math.abs(newY - robot.y) > 0.01
          const lastMoveTime = hasMoved ? Date.now() : (robot.lastMoveTime ?? Date.now())

          return {
            ...robot,
            x: newX,
            y: newY,
            orientation: newOrientation,
            destX: newDestX,
            destY: newDestY,
            lastMoveTime
          }
        })
      })
    }, UPDATE_INTERVAL)

    return () => clearInterval(intervalId)
  }, [products])

  return robots
}
