import { useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { DraggedPieceProps } from './types'

export const DraggedPiece = ({ gridSize }: DraggedPieceProps) => {
  const { camera, gl, raycaster } = useThree()
  const [position, setPosition] = useState<[number, number, number]>([
    0, 0.5, 0
  ])
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const intersection = useRef(new THREE.Vector3())

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)

      if (raycaster.ray.intersectPlane(plane.current, intersection.current)) {
        const clampedX = Math.max(
          -gridSize / 2,
          Math.min(gridSize / 2, intersection.current.x)
        )
        const clampedZ = Math.max(
          -gridSize / 2,
          Math.min(gridSize / 2, intersection.current.z)
        )
        setPosition([clampedX, 0.5, clampedZ])
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [camera, gl, raycaster, gridSize])

  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      <meshStandardMaterial color="#ff6b6b" opacity={0.7} transparent />
    </mesh>
  )
}
