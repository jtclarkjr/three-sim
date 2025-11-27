import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import { Vector3 } from 'three'
import type { Group } from 'three'
import { DomeRobotMesh } from './DomeRobotMesh'
import { TrackedRobotMesh } from './TrackedRobotMesh'
import { WalkingRobotMesh } from './WalkingRobotMesh'
import type { Robot } from './types'

interface RobotMeshProps {
  robot: Robot
  showLabel?: boolean
  isTracked?: boolean
}

export const RobotMesh = ({
  robot,
  showLabel = false,
  isTracked = false
}: RobotMeshProps) => {
  const groupRef = useRef<Group>(null)
  // Reuse vectors to avoid allocations in the render loop
  const worldPosition = useRef(new Vector3()).current
  const [isNearCamera, setIsNearCamera] = useState(false)
  const isCarrying = Boolean(robot.carryingProductId)

  useFrame(({ camera }) => {
    if (!groupRef.current) return

    groupRef.current.position.x = robot.x
    groupRef.current.position.z = robot.y
    groupRef.current.rotation.y = robot.orientation

    groupRef.current.getWorldPosition(worldPosition)
    const distance = camera.position.distanceTo(worldPosition)
    setIsNearCamera((prev) => {
      const next = distance < 70
      return prev === next ? prev : next
    })
  })

  const VariantMesh = useMemo(() => {
    switch (robot.variant) {
      case 'walking':
        return WalkingRobotMesh
      case 'tracked':
        return TrackedRobotMesh
      default:
        return DomeRobotMesh
    }
  }, [robot.variant])

  const shouldShowTextLabel = isNearCamera && (showLabel || isTracked)
  const shouldShowIndicator = !shouldShowTextLabel && (showLabel || isTracked)

  return (
    <group ref={groupRef}>
      {isTracked && (
        <>
          <mesh
            position={[0, 0.12, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={1.6}
          >
            <ringGeometry args={[0.9, 1.35, 36]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.55} />
          </mesh>
          <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1, 32]} />
            <meshBasicMaterial color="#0ea5e9" transparent opacity={0.15} />
          </mesh>
          <pointLight color="#67e8f9" intensity={1.8} distance={10} />
        </>
      )}

      <VariantMesh />
      {isCarrying && (
        <mesh position={[0, 2.9, 0]} castShadow>
          <boxGeometry args={[0.8, 0.35, 0.8]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#fb923c"
            emissiveIntensity={0.35}
            roughness={0.4}
          />
        </mesh>
      )}
      {shouldShowIndicator && (
        <mesh position={[0, 3.3, 0]}>
          <sphereGeometry args={[0.24, 16, 16]} />
          <meshStandardMaterial
            color={isTracked ? '#22d3ee' : '#cbd5e1'}
            emissive={isTracked ? '#06b6d4' : '#0f172a'}
            emissiveIntensity={isTracked ? 0.9 : 0.25}
          />
        </mesh>
      )}

      {shouldShowTextLabel && (
        <Html
          position={[0, 3.2, 0]}
          center
          style={{
            color: '#e0f2fe',
            fontSize: '12px',
            fontWeight: 700,
            background: isTracked
              ? 'rgba(8,47,73,0.85)'
              : 'rgba(15,23,42,0.65)',
            padding: '3px 8px',
            borderRadius: '10px',
            border: isTracked ? '1px solid #22d3ee' : '1px solid transparent',
            boxShadow: isTracked
              ? '0 0 0 1px rgba(34,211,238,0.35), 0 10px 25px rgba(34,211,238,0.18)'
              : 'none',
            letterSpacing: '0.01em'
          }}
        >
          <div>
            <div>{isTracked ? `Tracking ${robot.name}` : robot.name}</div>
            {isCarrying && (
              <div style={{ marginTop: 2, color: '#facc15', fontWeight: 600 }}>
                Carrying {robot.carryingProductId}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}
