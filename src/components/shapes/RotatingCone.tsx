import { useRotation } from '@/hooks/useRotation'
import { Scene3D } from '../_resuables/Scene3D'

interface ConeProps {
  rotationDelta: { x: number; y: number }
  isDragging: boolean
}

const Cone = ({ rotationDelta, isDragging }: ConeProps) => {
  const meshRef = useRotation({ rotationDelta, isDragging })

  return (
    <mesh ref={meshRef} castShadow position={[0, 0.5, 0]}>
      <coneGeometry args={[1.2, 2.5, 32]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  )
}

export const RotatingCone = () => {
  return (
    <Scene3D>
      {({ isDragging, rotationDelta }) => (
        <Cone rotationDelta={rotationDelta} isDragging={isDragging} />
      )}
    </Scene3D>
  )
}
