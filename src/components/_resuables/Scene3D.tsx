import { Canvas } from '@react-three/fiber'
import type { ReactNode } from 'react'
import { useDragControls } from '@/hooks/useDragControls'
import { Floor } from './Floor'

interface Scene3DProps {
  children: (props: {
    isDragging: boolean
    rotationDelta: { x: number; y: number }
  }) => ReactNode
  camera?: { position: [number, number, number]; fov: number }
  className?: string
  useDragControls?: boolean
  showFloor?: boolean
}

export const Scene3D = ({ 
  children, 
  camera = { position: [0, 1, 6], fov: 50 },
  className = "w-full h-[28rem] md:h-[40rem]",
  useDragControls: enableDragControls = true,
  showFloor = true
}: Scene3DProps) => {
  const {
    isDragging,
    rotationDelta,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  } = useDragControls()

  const containerProps = enableDragControls ? {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerLeave: handlePointerUp,
    className: `${className} cursor-grab active:cursor-grabbing`
  } : {
    className
  }

  return (
    <div {...containerProps}>
      <Canvas
        camera={camera}
        shadows
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        {children({ isDragging, rotationDelta })}
        {showFloor && <Floor />}
      </Canvas>
    </div>
  )
}
