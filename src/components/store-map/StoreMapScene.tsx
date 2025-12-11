import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { useRobotSimulation } from '@/hooks/useRobotSimulation'
import { generateProducts, generateRobots, STORE_BOUNDS } from './mockData'
import { Products } from './Products'
import { RobotMesh } from './RobotMesh'
import type { Product, Robot, RobotTask } from './types'

interface StoreMapSceneProps {
  productCount?: number
  robotCount?: number
  initialRobots?: Robot[]
  trackedRobotId?: string | null
  products?: Product[]
  activeCommand?: RobotTask | null
  onCommandComplete?: (commandId: string) => void
  onTrackedRobotUpdate?: (robot: Robot | undefined) => void
}

export const StoreMapScene = ({
  productCount = 100000,
  robotCount = 50,
  initialRobots,
  trackedRobotId,
  products,
  activeCommand,
  onCommandComplete,
  onTrackedRobotUpdate
}: StoreMapSceneProps) => {
  const productsToUse = useMemo(
    () => products ?? generateProducts(productCount),
    [productCount, products]
  )
  const robotsToSimulate = useMemo(
    () => initialRobots ?? generateRobots(robotCount),
    [initialRobots, robotCount]
  )
  const robots = useRobotSimulation(
    robotsToSimulate,
    productsToUse,
    activeCommand,
    onCommandComplete
  )
  const trackedRobot = useMemo(
    () => robots.find((robot) => robot.id === trackedRobotId),
    [robots, trackedRobotId]
  )
  useEffect(() => {
    onTrackedRobotUpdate?.(trackedRobot)
  }, [onTrackedRobotUpdate, trackedRobot])
  const shouldShowLabel = robotCount <= 20
  const targetProduct = useMemo(() => {
    if (!activeCommand) return null
    return (
      productsToUse.find((product) => product.id === activeCommand.productId) ??
      null
    )
  }, [activeCommand, productsToUse])

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{
          position: [0, 120, 80],
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        shadows
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0a0a0f']} />

        <ambientLight intensity={0.3} />
        <directionalLight
          position={[50, 100, 50]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={500}
          shadow-camera-left={-STORE_BOUNDS.width}
          shadow-camera-right={STORE_BOUNDS.width}
          shadow-camera-top={STORE_BOUNDS.height}
          shadow-camera-bottom={-STORE_BOUNDS.height}
        />

        <pointLight position={[0, 50, 0]} intensity={0.5} color="#ffffff" />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry
            args={[STORE_BOUNDS.width * 1.2, STORE_BOUNDS.height * 1.2]}
          />
          <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
        </mesh>

        <gridHelper
          args={[
            Math.max(STORE_BOUNDS.width, STORE_BOUNDS.height) * 1.2,
            40,
            '#00d4ff',
            '#003344'
          ]}
          position={[0, 0.01, 0]}
        />

        <Products products={productsToUse} />
        {targetProduct && (
          <group position={[targetProduct.x, 0, targetProduct.y]}>
            <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.8, 1.2, 36]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.75} />
            </mesh>
            <mesh position={[0, 1.2, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 1.5, 12]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#b91c1c"
                emissiveIntensity={0.5}
              />
            </mesh>
            <mesh position={[0, 2.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.5, 0.9, 20]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#f87171"
                emissiveIntensity={0.35}
              />
            </mesh>
          </group>
        )}

        {robots.map((robot) => (
          <RobotMesh
            key={robot.id}
            robot={robot}
            showLabel={shouldShowLabel}
            isTracked={trackedRobotId === robot.id}
          />
        ))}

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={20}
          maxDistance={300}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  )
}
