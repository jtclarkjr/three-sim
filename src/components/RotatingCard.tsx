import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import type * as THREE from 'three'
import type { Group } from 'three'
import {
  createAceOfSpadesTexture,
  createCardBackTexture
} from '@/utils/cardTextures'
import { Scene3D } from './_resuables/Scene3D'

interface CardProps {
  rotationDelta: { x: number; y: number }
  isDragging: boolean
}

const Card = ({ rotationDelta, isDragging }: CardProps) => {
  const meshRef = useRef<Group>(null)
  const velocityRef = useRef({ x: 0, y: 0 })
  const autoRotateRef = useRef(true)
  const [frontTexture, setFrontTexture] = useState<THREE.CanvasTexture | null>(
    null
  )
  const [backTexture, setBackTexture] = useState<THREE.CanvasTexture | null>(
    null
  )

  useEffect(() => {
    setFrontTexture(createAceOfSpadesTexture())
    setBackTexture(createCardBackTexture())
  }, [])

  const hasRotationInput = (x: number, y: number) => x !== 0 || y !== 0

  const handleDraggingRotation = () => {
    if (!meshRef.current) return

    meshRef.current.rotation.y += rotationDelta.x * 0.015
    meshRef.current.rotation.x += rotationDelta.y * 0.015

    velocityRef.current = {
      x: rotationDelta.x * 0.8,
      y: rotationDelta.y * 0.8
    }

    autoRotateRef.current = false
  }

  const handleMomentumRotation = (delta: number) => {
    if (!meshRef.current) return

    const FRICTION = 0.95
    const VELOCITY_THRESHOLD = 0.01

    meshRef.current.rotation.y += velocityRef.current.x * delta
    meshRef.current.rotation.x += velocityRef.current.y * delta

    velocityRef.current.x *= FRICTION
    velocityRef.current.y *= FRICTION

    const hasStoppedMoving =
      Math.abs(velocityRef.current.x) < VELOCITY_THRESHOLD &&
      Math.abs(velocityRef.current.y) < VELOCITY_THRESHOLD

    if (hasStoppedMoving) {
      velocityRef.current = { x: 0, y: 0 }
      autoRotateRef.current = true
    }
  }

  const handleAutoRotation = (delta: number) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * 0.5
  }

  useFrame((_state, delta) => {
    if (!meshRef.current) return

    if (isDragging && hasRotationInput(rotationDelta.x, rotationDelta.y)) {
      handleDraggingRotation()
    } else if (
      !isDragging &&
      hasRotationInput(velocityRef.current.x, velocityRef.current.y)
    ) {
      handleMomentumRotation(delta)
    } else if (autoRotateRef.current && !isDragging) {
      handleAutoRotation(delta)
    }
  })

  if (!frontTexture || !backTexture) return null

  const cardThickness = 0.009
  const halfThickness = cardThickness / 1.9

  return (
    <group ref={meshRef} rotation={[0.2, 0.3, 0]}>
      <mesh castShadow position={[0, 0.5, halfThickness]}>
        <planeGeometry args={[1.8, 2.5]} />
        <meshStandardMaterial map={frontTexture} />
      </mesh>
      <mesh
        castShadow
        position={[0, 0.5, -halfThickness]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[1.8, 2.5]} />
        <meshStandardMaterial map={backTexture} />
      </mesh>
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1.8, 2.5, cardThickness]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

export const RotatingCard = () => {
  return (
    <Scene3D>
      {({ isDragging, rotationDelta }) => (
        <Card rotationDelta={rotationDelta} isDragging={isDragging} />
      )}
    </Scene3D>
  )
}
