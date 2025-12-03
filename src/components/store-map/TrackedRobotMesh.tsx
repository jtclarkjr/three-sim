import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'

export const TrackedRobotMesh = () => {
  const leftTrackRef = useRef<Mesh>(null)
  const rightTrackRef = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const rotation = t * 2

    if (leftTrackRef.current) leftTrackRef.current.rotation.x = rotation
    if (rightTrackRef.current) rightTrackRef.current.rotation.x = rotation
  })

  return (
    <group>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.2, 1.6]} />
        <meshStandardMaterial color="#f6c344" roughness={0.6} />
      </mesh>

      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[2, 0.6, 1.2]} />
        <meshStandardMaterial color="#f0a71a" metalness={0.2} />
      </mesh>

      <mesh position={[0.65, 1.7, 0.6]} castShadow>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial
          color="#262626"
          emissive="#00ffc3"
          emissiveIntensity={0.9}
        />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.65, 1.7, 0.6]} castShadow>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial
          color="#262626"
          emissive="#00ffc3"
          emissiveIntensity={0.9}
        />
      </mesh>

      {/* Left wheel */}
      <mesh
        position={[0.9, 0.35, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        ref={leftTrackRef}
        castShadow
        receiveShadow
      >
        <torusGeometry args={[0.55, 0.14, 12, 32]} />
        <meshStandardMaterial color="#bebebeff" roughness={0.9} />
      </mesh>

      {/* Right wheel */}
      <mesh
        position={[-0.9, 0.35, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        ref={rightTrackRef}
        castShadow
        receiveShadow
      >
        <torusGeometry args={[0.55, 0.14, 12, 32]} />
        <meshStandardMaterial color="#bebebeff" roughness={0.9} />
      </mesh>

      {/* Bottom base */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.4, 1.8]} />
        <meshStandardMaterial color="#f5b342ff" roughness={0.9} />
      </mesh>
    </group>
  )
}
