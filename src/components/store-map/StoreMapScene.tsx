import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { useRobotSimulation } from '@/hooks/useRobotSimulation'
import { generateProducts, generateRobots } from './mockData'
import { Products } from './Products'
import { RobotMesh } from './RobotMesh'
import type { AisleConfig, Product, Robot, RobotTask } from './types'
import { DEFAULT_AISLE_CONFIG } from './types'

interface StoreMapSceneProps {
  productCount?: number
  robotCount?: number
  initialRobots?: Robot[]
  trackedRobotId?: string | null
  products?: Product[]
  activeCommand?: RobotTask | null
  onCommandComplete?: (commandId: string) => void
  onTrackedRobotUpdate?: (robot: Robot | undefined) => void
  aisleConfig?: AisleConfig
}

export const StoreMapScene = ({
  productCount = 100000,
  robotCount = 50,
  initialRobots,
  trackedRobotId,
  products,
  activeCommand,
  onCommandComplete,
  onTrackedRobotUpdate,
  aisleConfig = DEFAULT_AISLE_CONFIG
}: StoreMapSceneProps) => {
  const productsToUse = useMemo(
    () => products ?? generateProducts(productCount, aisleConfig),
    [productCount, products, aisleConfig]
  )
  const robotsToSimulate = useMemo(
    () => initialRobots ?? generateRobots(robotCount, aisleConfig),
    [initialRobots, robotCount, aisleConfig]
  )
  const robots = useRobotSimulation(
    robotsToSimulate,
    productsToUse,
    activeCommand,
    onCommandComplete,
    aisleConfig
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

  const cameraDistance = useMemo(() => {
    const maxDimension = Math.max(
      aisleConfig.storeWidth,
      aisleConfig.storeHeight
    )
    return maxDimension * 0.8
  }, [aisleConfig.storeWidth, aisleConfig.storeHeight])

  const maxCameraDistance = useMemo(() => {
    const maxDimension = Math.max(
      aisleConfig.storeWidth,
      aisleConfig.storeHeight
    )
    return maxDimension * 2
  }, [aisleConfig.storeWidth, aisleConfig.storeHeight])

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{
          position: [0, cameraDistance, cameraDistance * 0.6],
          fov: 75,
          near: 0.1,
          far: 2000
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
          shadow-camera-left={-aisleConfig.storeWidth}
          shadow-camera-right={aisleConfig.storeWidth}
          shadow-camera-top={aisleConfig.storeHeight}
          shadow-camera-bottom={-aisleConfig.storeHeight}
        />

        <pointLight position={[0, 50, 0]} intensity={0.5} color="#ffffff" />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry
            args={[aisleConfig.storeWidth * 1.2, aisleConfig.storeHeight * 1.2]}
          />
          <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
        </mesh>

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
          enablePan
          minDistance={20}
          maxDistance={maxCameraDistance}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, 0]}
          panSpeed={1}
        />
      </Canvas>
    </div>
  )
}
