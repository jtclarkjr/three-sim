import { useRotation } from '@/hooks/useRotation'
import { Scene3D } from '../_resuables/Scene3D'

interface TorusProps {
  rotationDelta: { x: number; y: number }
  isDragging: boolean
}

const Torus = ({ rotationDelta, isDragging }: TorusProps) => {
  const meshRef = useRotation({ rotationDelta, isDragging })

  return (
    <mesh ref={meshRef} castShadow position={[0, 0.5, 0]}>
      <torusGeometry args={[1, 0.4, 16, 100]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  )
}

export const RotatingTorus = () => {
  return (
    <Scene3D>
      {({ isDragging, rotationDelta }) => (
        <Torus rotationDelta={rotationDelta} isDragging={isDragging} />
      )}
    </Scene3D>
  )
}
