import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'

export const WalkingRobotMesh = () => {
  const leftLegRef = useRef<Mesh>(null)
  const rightLegRef = useRef<Mesh>(null)
  const torsoRef = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const swing = Math.sin(t * 3) * 0.4

    if (leftLegRef.current) leftLegRef.current.rotation.x = swing
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing
    if (torsoRef.current)
      torsoRef.current.position.y = 1.2 + Math.sin(t * 3) * 0.05
  })

  return (
    <group>
      <mesh position={[0, 1.2, 0]} ref={torsoRef} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.6, 0.8]} />
        <meshStandardMaterial color="#3ae0ff" metalness={0.3} roughness={0.4} />
      </mesh>

      <mesh position={[0, 2.2, 0]} castShadow>
        <boxGeometry args={[1.1, 0.6, 0.7]} />
        <meshStandardMaterial color="#1c9bd3" metalness={0.3} roughness={0.5} />
      </mesh>

      <mesh position={[0.45, 2.2, 0.35]} castShadow>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#00ffb2"
          emissiveIntensity={0.7}
        />
      </mesh>

      <mesh position={[0, 2.8, 0]} castShadow>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial color="#e4f6ff" roughness={0.3} />
      </mesh>

      <mesh position={[0, 2.8, 0.25]} castShadow>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial
          color="#0af0ff"
          emissive="#0af0ff"
          emissiveIntensity={0.6}
        />
      </mesh>

      <mesh position={[0.9, 1.2, 0]} castShadow>
        <boxGeometry args={[0.3, 1.1, 0.3]} />
        <meshStandardMaterial color="#2bd2ff" />
      </mesh>

      <mesh position={[-0.9, 1.2, 0]} castShadow>
        <boxGeometry args={[0.3, 1.1, 0.3]} />
        <meshStandardMaterial color="#2bd2ff" />
      </mesh>

      <mesh
        ref={leftLegRef}
        position={[-0.35, 0.4, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.45, 0.9, 0.45]} />
        <meshStandardMaterial color="#0bb2ff" />
      </mesh>

      <mesh
        ref={rightLegRef}
        position={[0.35, 0.4, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.45, 0.9, 0.45]} />
        <meshStandardMaterial color="#0bb2ff" />
      </mesh>

      <mesh position={[0.35, 0.05, 0]} receiveShadow>
        <boxGeometry args={[0.55, 0.1, 0.6]} />
        <meshStandardMaterial color="#073d4f" roughness={0.8} />
      </mesh>

      <mesh position={[-0.35, 0.05, 0]} receiveShadow>
        <boxGeometry args={[0.55, 0.1, 0.6]} />
        <meshStandardMaterial color="#073d4f" roughness={0.8} />
      </mesh>
    </group>
  )
}
