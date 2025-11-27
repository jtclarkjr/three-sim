import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
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

  useFrame(() => {
    if (!groupRef.current) return

    groupRef.current.position.x = robot.x
    groupRef.current.position.z = robot.y
    groupRef.current.rotation.y = robot.orientation
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

  const shouldShowLabel = showLabel || isTracked

  return (
    <group ref={groupRef}>
      {isTracked && (
        <>
          <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={1.6}>
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
      {shouldShowLabel && (
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
          {isTracked ? `Tracking ${robot.name}` : robot.name}
        </Html>
      )}
    </group>
  )
}
