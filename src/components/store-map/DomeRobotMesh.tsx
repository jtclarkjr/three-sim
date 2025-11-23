import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'

export const DomeRobotMesh = () => {
  const domeRef = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (domeRef.current) domeRef.current.rotation.y = Math.sin(t) * 0.4
  })

  return (
    <group>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 1.1, 1.8, 24]} />
        <meshStandardMaterial color="#c9d4ff" metalness={0.1} roughness={0.5} />
      </mesh>

      <mesh position={[0, 2, 0]} ref={domeRef} castShadow>
        <sphereGeometry
          args={[0.9, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.1]}
        />
        <meshStandardMaterial
          color="#8fb3ff"
          metalness={0.15}
          roughness={0.35}
        />
      </mesh>

      <mesh position={[0.35, 1.9, 0.55]} castShadow>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial
          color="#1a1a1a"
          emissive="#64f4ff"
          emissiveIntensity={0.9}
        />
      </mesh>

      <mesh position={[0.2, 2.2, -0.1]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>

      <mesh position={[-0.2, 2.2, -0.1]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>

      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.1, 20]} />
        <meshStandardMaterial color="#0b1120" roughness={0.8} />
      </mesh>
    </group>
  )
}
