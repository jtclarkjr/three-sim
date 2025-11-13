export interface Product {
  id: string
  x: number
  y: number
}

export interface Robot {
  id: string
  name: string
  x: number
  y: number
  orientation: number // in radians
  speed: number
  destX: number
  destY: number
  velocityX?: number // for bounce physics
  velocityY?: number // for bounce physics
}
