import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useId, useState } from 'react'
import { generateRobots } from '@/components/store-map/mockData'
import { StoreMapScene } from '@/components/store-map/StoreMapScene'
import { useWasmCompute } from '@/hooks/useWasmCompute'

export const Route = createFileRoute('/robots')({ component: RobotsMap })

function RobotsMap() {
  const [productCount, setProductCount] = useState(20000)
  const [robotCount, setRobotCount] = useState(30)
  const [sceneSeed, setSceneSeed] = useState(0)
  const [trackedRobotId, setTrackedRobotId] = useState<string | null>(null)
  const [sampleMagnitude, setSampleMagnitude] = useState<string | null>(null)
  const [initialRobots, setInitialRobots] = useState(() =>
    generateRobots(robotCount)
  )
  const productRangeId = useId()
  const robotRangeId = useId()
  const trackSelectId = useId()
  const { ready: wasmReady, computeMagnitudes } = useWasmCompute()

  useEffect(() => {
    if (!wasmReady || !computeMagnitudes) return
    const demo = new Float32Array([3, 4, 0]) // length should be 5
    const result = computeMagnitudes(demo)
    setSampleMagnitude(result[0]?.toFixed(2) ?? null)
  }, [computeMagnitudes, wasmReady])

  useEffect(() => {
    // Re-roll robots when sceneSeed changes, even if the count stays the same
    void sceneSeed
    setInitialRobots(generateRobots(robotCount))
  }, [robotCount, sceneSeed])

  useEffect(() => {
    if (!initialRobots.length) {
      setTrackedRobotId(null)
      return
    }

    setTrackedRobotId((current) => {
      if (current && initialRobots.some((robot) => robot.id === current)) {
        return current
      }
      return initialRobots[0]?.id ?? null
    })
  }, [initialRobots])

  const handleReset = () => {
    setSceneSeed((prev) => prev + 1)
  }

  return (
    <div className="relative w-full h-screen bg-slate-900">
      <Link
        to="/"
        className="absolute top-4 left-4 z-10 bg-slate-800/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-cyan-400 hover:text-cyan-300 hover:bg-slate-700/90 transition-colors font-semibold"
      >
        Home
      </Link>

      <div className="absolute top-4 right-4 z-10 bg-slate-800/90 backdrop-blur-sm p-4 rounded-lg shadow-lg text-white">
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

          <div>
            <label htmlFor={trackSelectId} className="block mb-1 text-gray-300">
              Track robot
            </label>
            <select
              id={trackSelectId}
              value={trackedRobotId ?? ''}
              onChange={(event) => {
                const selected = event.target.value
                setTrackedRobotId(selected || null)
              }}
              className="w-full bg-slate-900/60 border border-slate-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">— None —</option>
              {initialRobots.map((robot) => (
                <option key={robot.id} value={robot.id}>
                  {robot.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Tracked robots are highlighted and labeled even in crowded scenes.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Reset Positions
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-300 space-y-1">
          <div className="flex items-center justify-between">
            <span>Rust/Wasm compute:</span>
            <span className="font-semibold">
              {wasmReady ? 'Ready' : 'Loading...'}
            </span>
          </div>
          <div className="text-gray-400">
            Magnitude (3,4,0):{' '}
            <span className="text-cyan-300">{sampleMagnitude ?? '—'}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
          <p>Use mouse to pan, zoom, and rotate the view</p>
        </div>
      </div>

      <StoreMapScene
        key={sceneSeed}
        productCount={productCount}
        robotCount={robotCount}
        initialRobots={initialRobots}
        trackedRobotId={trackedRobotId}
      />
    </div>
  )
}
