import { Vector3 } from 'three'

export type CollisionBox = {
  min: Vector3
  max: Vector3
}

export const collisionBoxes: CollisionBox[] = [
  // Back wall
  { min: new Vector3(-15, 0, -10.15), max: new Vector3(15, 5, -9.85) },
  // Left wall
  { min: new Vector3(-15.15, 0, -5), max: new Vector3(-14.85, 5, 15) },
  // Right wall
  { min: new Vector3(14.85, 0, -5), max: new Vector3(15.15, 5, 15) },
  // Columns
  { min: new Vector3(-8.4, 0, -5.4), max: new Vector3(-7.6, 5, -4.6) },
  { min: new Vector3(7.6, 0, -5.4), max: new Vector3(8.4, 5, -4.6) },
  { min: new Vector3(-8.4, 0, 4.6), max: new Vector3(-7.6, 5, 5.4) },
  { min: new Vector3(7.6, 0, 4.6), max: new Vector3(8.4, 5, 5.4) },
  // Furniture pieces
  { min: new Vector3(-5.8, 0, -5.8), max: new Vector3(-4.2, 1.5, -4.2) },
  { min: new Vector3(4.2, 0, -5.8), max: new Vector3(5.8, 1.5, -4.2) },
  { min: new Vector3(-0.8, 0, -0.8), max: new Vector3(0.8, 1.5, 0.8) }
]

export function checkCollision(position: Vector3, radius: number): boolean {
  for (const box of collisionBoxes) {
    const closestX = Math.max(box.min.x, Math.min(position.x, box.max.x))
    const closestZ = Math.max(box.min.z, Math.min(position.z, box.max.z))

    const distanceX = position.x - closestX
    const distanceZ = position.z - closestZ
    const distanceSquared = distanceX * distanceX + distanceZ * distanceZ

    if (distanceSquared < radius * radius) {
      return true
    }
  }
  return false
}
