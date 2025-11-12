import type { ThreeEvent } from '@react-three/fiber'

export interface GridSquareProps {
  position: [number, number, number]
  hasPiece: boolean
  onClick: () => void
  onPointerDown: () => void
  onPointerUp: () => void
  onPointerEnter: () => void
  isDragTarget: boolean
  isInvalidTarget: boolean
  isDragging: boolean
}

export interface DraggedPieceProps {
  gridSize: number
}

export interface GridPosition {
  x: number
  z: number
}

export type ThreePointerEvent = ThreeEvent<PointerEvent>
export type ThreeMouseEvent = ThreeEvent<MouseEvent>
