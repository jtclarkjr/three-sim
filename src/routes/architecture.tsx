import { Sky } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Suspense } from 'react'
import { BuildingInterior } from '@/components/architecture-walkthrough/BuildingInterior'
import { FirstPersonControls } from '@/components/architecture-walkthrough/FirstPersonControls'
import { Lighting } from '@/components/architecture-walkthrough/Lighting'

export const Route = createFileRoute('/architecture')({
  component: ArchitectureWalkthrough
})

function ArchitectureWalkthrough() {
  return (
    <div className="relative h-screen w-full">
      <Link
        to="/"
        className="absolute top-6 left-6 z-10 bg-slate-800/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-cyan-400 hover:text-cyan-300 hover:bg-slate-700/90 transition-colors font-semibold"
      >
        Home
      </Link>

      <div className="absolute left-6 top-20 z-10 rounded-lg bg-black/50 p-4 text-white backdrop-blur-sm">
        <h1 className="mb-2 text-2xl font-bold">Architectural Walkthrough</h1>
        <p className="mb-2 text-sm">Click to enable first-person controls</p>
        <ul className="space-y-1 text-xs">
          <li>• W/A/S/D - Move forward/left/backward/right</li>
          <li>• Mouse - Look around</li>
          <li>• ESC - Exit controls</li>
        </ul>
      </div>

      <Canvas
        shadows
        camera={{ position: [0, 1.6, 5], fov: 75 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <BuildingInterior />
          <Lighting />
          <Sky sunPosition={[100, 20, 100]} />
          <FirstPersonControls />
        </Suspense>
      </Canvas>
    </div>
  )
}
