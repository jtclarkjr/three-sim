import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import { generateProducts, generateRobots, STORE_BOUNDS } from './mockData'
import { Products } from './Products'
import { RobotMesh } from './RobotMesh'
import { useRobotSimulation } from './useRobotSimulation'

interface StoreMapSceneProps {
  productCount?: number
  robotCount?: number
}

export function StoreMapScene({
  productCount = 100000,
  robotCount = 50
}: StoreMapSceneProps) {
  const products = useMemo(() => generateProducts(productCount), [productCount])
  const initialRobots = useMemo(() => generateRobots(robotCount), [robotCount])
  const robots = useRobotSimulation(initialRobots, products)

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

        <Products products={products} />

        {robots.map((robot) => (
          <RobotMesh key={robot.id} robot={robot} showLabel={robotCount <= 20} />
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
