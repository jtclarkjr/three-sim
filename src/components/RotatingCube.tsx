import { RoundedBox } from '@react-three/drei'
import { useRotation } from '@/hooks/useRotation'
import { Scene3D } from './_resuables/Scene3D'

interface CubeProps {
  rotationDelta: { x: number; y: number }
  isDragging: boolean
}

const Cube = ({ rotationDelta, isDragging }: CubeProps) => {
  const meshRef = useRotation({ rotationDelta, isDragging })

  return (
    <group ref={meshRef} position={[0, 0.5, 0]}>
      <RoundedBox args={[2, 2, 2]} radius={0.15} smoothness={4} castShadow>
        <meshPhysicalMaterial
          color="black"
          transparent
          opacity={0.25}
          roughness={0.05}
          metalness={0}
          transmission={0.92}
          thickness={0.5}
          ior={1.45}
        />
      </RoundedBox>
    </group>
  )
}

export const RotatingCube = () => {
  return (
    <Scene3D>
      {({ isDragging, rotationDelta }) => (
        <Cube rotationDelta={rotationDelta} isDragging={isDragging} />
      )}
    </Scene3D>
  )
}
