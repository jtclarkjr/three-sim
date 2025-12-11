import { useRotation } from '@/hooks/useRotation'
import { Scene3D } from '../_resuables/Scene3D'

interface SphereProps {
  rotationDelta: { x: number; y: number }
  isDragging: boolean
}

const Sphere = ({ rotationDelta, isDragging }: SphereProps) => {
  const meshRef = useRotation({ rotationDelta, isDragging })

  return (
    <mesh ref={meshRef} castShadow position={[0, 0.5, 0]}>
      <sphereGeometry args={[1.2, 32, 32]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  )
}

export const RotatingSphere = () => {
  return (
    <Scene3D>
      {({ isDragging, rotationDelta }) => (
        <Sphere rotationDelta={rotationDelta} isDragging={isDragging} />
      )}
    </Scene3D>
  )
}
