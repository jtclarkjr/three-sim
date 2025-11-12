import { useState } from 'react'
import type { GridSquareProps, ThreeMouseEvent, ThreePointerEvent } from './types'

export const GridSquare = ({ position, hasPiece, onClick, onPointerDown, onPointerUp, onPointerEnter, isDragTarget, isInvalidTarget, isDragging }: GridSquareProps) => {
  const [hovered, setHovered] = useState(false)

  const getColor = () => {
    if (isInvalidTarget) return '#ff0000'
    if (isDragTarget) return '#00ff00'
    if (hovered) return '#4a9eff'
    return '#2a2a2a'
  }

  return (
    <group>
      <mesh
        position={position}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e: ThreeMouseEvent) => {
          e.stopPropagation()
          onClick()
        }}
        onPointerDown={(e: ThreePointerEvent) => {
          e.stopPropagation()
          onPointerDown()
          if (hasPiece) {
            document.body.style.cursor = 'grabbing'
          }
        }}
        onPointerUp={(e: ThreePointerEvent) => {
          e.stopPropagation()
          onPointerUp()
          document.body.style.cursor = 'auto'
        }}
        onPointerEnter={() => {
          setHovered(true)
          onPointerEnter()
          if (hasPiece && !isDragging) {
            document.body.style.cursor = 'grab'
          }
        }}
        onPointerLeave={() => {
          setHovered(false)
          if (!isDragging) {
            document.body.style.cursor = 'auto'
          }
        }}
      >
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial
          color={getColor()}
          opacity={0.8}
          transparent
        />
      </mesh>
      {hasPiece && !isDragging && (
        <mesh position={[position[0], position[1] + 0.5, position[2]]} castShadow>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshStandardMaterial color="#ff6b6b" />
        </mesh>
      )}
    </group>
  )
}
