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
}
