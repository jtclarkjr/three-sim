import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'
import type { Robot } from './types'

interface RobotMeshProps {
  robot: Robot
  showLabel?: boolean
}

export const RobotMesh = ({ robot, showLabel = false }: RobotMeshProps) => {
  const meshRef = useRef<Mesh>(null)
  const bodyRef = useRef<Mesh>(null)

  useFrame(() => {
    if (!meshRef.current) return

    meshRef.current.position.x = robot.x
    meshRef.current.position.z = robot.y
    meshRef.current.rotation.y = robot.orientation
  })

  return (
    <group ref={meshRef}>
      <mesh position={[0, 1, 0]} ref={bodyRef}>
        <cylinderGeometry args={[1.5, 1.5, 2, 16]} />
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={0.3}
        />
      </mesh>

      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#00d4ff"
          emissiveIntensity={0.2}
        />
      </mesh>

      <mesh position={[0, 2.5, 0.6]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#00ff00"
          emissiveIntensity={0.8}
        />
      </mesh>

      <mesh position={[1.2, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
        <meshStandardMaterial color="#00a8cc" />
      </mesh>

      <mesh position={[-1.2, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
        <meshStandardMaterial color="#00a8cc" />
      </mesh>

      {showLabel && (
        // <Text
        //   position={[0, 4, 0]}
        //   fontSize={0.8}
        //   color="#00d4ff"
        //   anchorX="center"
        //   anchorY="middle"
        //   outlineWidth={0.02}
        //   outlineColor="#000000"
        // >
        //   {robot.name}
        // </Text>
        null
      )}
    </group>
  )
}
