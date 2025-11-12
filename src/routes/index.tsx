import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { RotatingCone } from '@/components/RotatingCone'
import { RotatingCube } from '@/components/RotatingCube'
import { RotatingSphere } from '@/components/RotatingSphere'
import { RotatingTorus } from '@/components/RotatingTorus'
import { RotatingCard } from '@/components/RotatingCard'
import { GridFloor } from '@/components/grid/GridFloor'

export const Route = createFileRoute('/')({ component: App })

type Shape = 'GRID' | 'CARD' | 'CUBE' | 'SPHERE' | 'TORUS' | 'CONE'

const shapes: Shape[] = ['GRID', 'CARD', 'CUBE', 'SPHERE', 'TORUS', 'CONE', ]

const shapeComponents: Record<Shape, React.JSX.Element> = {
  CARD: <RotatingCard />,
  CUBE: <RotatingCube />,
  SPHERE: <RotatingSphere />,
  TORUS: <RotatingTorus />,
  CONE: <RotatingCone />,
  GRID: <GridFloor />,
}

function App() {
  const [selectedWord, setSelectedWord] = useState<Shape>('GRID')

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="py-20 px-6 vh-100 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 pointer-events-none" />

        <h1 className="text-6xl md:text-7xl font-black text-white [letter-spacing:-0.08em] mb-12">
          <span className="text-gray-300">Three</span>{' '}
          <select
            value={selectedWord}
            onChange={(e) => setSelectedWord(e.target.value as Shape)}
            className="appearance-none bg-transparent rounded-lg px-4 py-2 text-cyan-400 font-black text-6xl md:text-7xl cursor-pointer hover:border-cyan-400 transition-colors [letter-spacing:-0.08em] w-auto"

          >
            {shapes.map((shape) => (
              <option key={shape} value={shape} className="bg-slate-800 text-cyan-400">
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
