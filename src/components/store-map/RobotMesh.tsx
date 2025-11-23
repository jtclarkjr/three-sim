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
}

export const RobotMesh = ({ robot, showLabel = false }: RobotMeshProps) => {
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

  return (
    <group ref={groupRef}>
      <VariantMesh />
      {showLabel && (
        <Html
          position={[0, 3.2, 0]}
          center
          style={{
            color: '#a5f3fc',
            fontSize: '12px',
            fontWeight: 600,
            background: 'rgba(15,23,42,0.65)',
            padding: '2px 6px',
            borderRadius: '6px'
          }}
        >
          {robot.name}
        </Html>
      )}
    </group>
  )
}
