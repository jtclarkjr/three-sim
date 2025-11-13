import { createFileRoute, Link } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { StoreMapScene } from '@/components/store-map/StoreMapScene'

export const Route = createFileRoute('/robots')({ component: RobotsMap })

function RobotsMap() {
  const [productCount, setProductCount] = useState(20000)
  const [robotCount, setRobotCount] = useState(10)
  const [key, setKey] = useState(0)
  const productRangeId = useId()
  const robotRangeId = useId()

  const handleReset = () => {
    setKey((prev) => prev + 1)
  }

  return (
    <div className="relative w-full h-screen bg-slate-900">
      <Link
        to="/"
        className="absolute top-4 right-4 z-10 bg-slate-800/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-cyan-400 hover:text-cyan-300 hover:bg-slate-700/90 transition-colors font-semibold"
      >
        Home
      </Link>

      <div className="absolute top-4 left-4 z-10 bg-slate-800/90 backdrop-blur-sm p-4 rounded-lg shadow-lg text-white">
        <h2 className="text-xl font-bold mb-3 text-cyan-400">
          Robots in store simulation
        </h2>

        <div className="space-y-3 text-sm">
          <div>
            <label
              htmlFor={productRangeId}
              className="block mb-1 text-gray-300"
            >
              Products: {productCount.toLocaleString()}
            </label>
            <input
              id={productRangeId}
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={productCount}
              onChange={(e) => setProductCount(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor={robotRangeId} className="block mb-1 text-gray-300">
              Robots: {robotCount}
            </label>
            <input
              id={robotRangeId}
              type="range"
              min="1"
              max="50"
              value={robotCount}
              onChange={(e) => setRobotCount(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Reset Positions
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
          <p>Use mouse to pan, zoom, and rotate the view</p>
        </div>
      </div>

      <StoreMapScene
        key={key}
        productCount={productCount}
        robotCount={robotCount}
      />
    </div>
  )
}
