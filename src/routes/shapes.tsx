import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { GridFloor } from '@/components/grid/GridFloor'
import { RotatingCard } from '@/components/RotatingCard'
import { RotatingCone } from '@/components/RotatingCone'
import { RotatingCube } from '@/components/RotatingCube'
import { RotatingSphere } from '@/components/RotatingSphere'
import { RotatingTorus } from '@/components/RotatingTorus'

export const Route = createFileRoute('/shapes')({ component: App })

type Shape = 'GRID' | 'CARD' | 'CUBE' | 'SPHERE' | 'TORUS' | 'CONE'

const shapes: Shape[] = ['GRID', 'CARD', 'CUBE', 'SPHERE', 'TORUS', 'CONE']

const shapeComponents: Record<Shape, React.JSX.Element> = {
  CARD: <RotatingCard />,
  CUBE: <RotatingCube />,
  SPHERE: <RotatingSphere />,
  TORUS: <RotatingTorus />,
  CONE: <RotatingCone />,
  GRID: <GridFloor />
}

function App() {
  const [selectedWord, setSelectedWord] = useState<Shape>('GRID')

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Link
        to="/"
        className="absolute top-6 left-6 z-10 bg-slate-800/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-cyan-400 hover:text-cyan-300 hover:bg-slate-700/90 transition-colors font-semibold"
      >
        Home
      </Link>

      <section className="py-20 px-6 vh-100 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 pointer-events-none" />

        <h1 className="text-6xl md:text-7xl font-black text-white [letter-spacing:-0.08em] mb-12">
          <span className="text-gray-300">Three</span>{' '}
          <select
            value={selectedWord}
            onChange={(e) => setSelectedWord(e.target.value as Shape)}
            className="bg-transparent border-2 border-cyan-400/50 rounded-lg px-4 py-2 text-cyan-400 font-black text-6xl md:text-7xl cursor-pointer hover:border-cyan-400 transition-colors [letter-spacing:-0.08em] w-auto"
          >
            {shapes.map((shape) => (
              <option
                key={shape}
                value={shape}
                className="bg-slate-800 text-cyan-400"
              >
                {shape}
              </option>
            ))}
          </select>
        </h1>

        {shapeComponents[selectedWord]}
      </section>
    </div>
  )
}
