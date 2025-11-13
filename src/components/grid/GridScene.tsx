import { OrbitControls } from '@react-three/drei'
import { useRef, useState } from 'react'
import { DoubleSide } from 'three'
import type { OrbitControls as OrbitControlsType } from 'three-stdlib'
import { DraggedPiece } from './DraggedPiece'
import { GridSquare } from './GridSquare'
import type { GridPosition } from './types'

export const GridScene = () => {
  const gridSize = 8
  const [pieces, setPieces] = useState<Set<string>>(new Set())
  const [draggedFrom, setDraggedFrom] = useState<string | null>(null)
  const [hoverTarget, setHoverTarget] = useState<string | null>(null)
  const orbitControlsRef = useRef<OrbitControlsType>(null)

  const togglePiece = (x: number, z: number) => {
    const key = `${x},${z}`
    setPieces((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const handlePointerDown = (x: number, z: number) => {
    const key = `${x},${z}`
    if (pieces.has(key)) {
      setDraggedFrom(key)
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = false
      }
    }
  }

  const handlePointerEnter = (x: number, z: number) => {
    if (draggedFrom) {
      const key = `${x},${z}`
      setHoverTarget(key)
    }
  }

  const handlePointerUp = (x: number, z: number) => {
    if (draggedFrom) {
      const targetKey = `${x},${z}`
      if (draggedFrom !== targetKey && !pieces.has(targetKey)) {
        setPieces((prev) => {
          const newSet = new Set(prev)
          newSet.delete(draggedFrom)
          newSet.add(targetKey)
          return newSet
        })
      }
    }
    setDraggedFrom(null)
    setHoverTarget(null)
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true
    }
  }

  const gridSquares: GridPosition[] = []
  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      gridSquares.push({ x, z })
    }
  }

  return (
    <>
      <OrbitControls
        ref={orbitControlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={20}
      />

      {gridSquares.map(({ x, z }) => {
        const posX = x - gridSize / 2 + 0.5
        const posZ = z - gridSize / 2 + 0.5
        const key = `${x},${z}`
        const isHoveringThisSquare =
          draggedFrom !== null && draggedFrom !== key && hoverTarget === key
        const isValidDrop = isHoveringThisSquare && !pieces.has(key)
        const isInvalidDrop = isHoveringThisSquare && pieces.has(key)

        return (
          <GridSquare
            key={key}
            position={[posX, 0, posZ]}
            hasPiece={pieces.has(key)}
            onClick={() => togglePiece(x, z)}
            onPointerDown={() => handlePointerDown(x, z)}
            onPointerUp={() => handlePointerUp(x, z)}
            onPointerEnter={() => handlePointerEnter(x, z)}
            isDragTarget={isValidDrop}
            isInvalidTarget={isInvalidDrop}
            isDragging={draggedFrom === key}
          />
        )
      })}

      {draggedFrom && pieces.has(draggedFrom) && (
        <DraggedPiece gridSize={gridSize} />
      )}

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, -0.01, 0]}
      >
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial color="#1a1a1a" side={DoubleSide} />
      </mesh>
    </>
  )
}
