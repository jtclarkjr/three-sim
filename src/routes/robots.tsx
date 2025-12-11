import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useId, useMemo, useState } from 'react'
import {
  AISLE_CONFIG,
  generateProducts,
  generateRobots,
  getAisleCenterX,
  STORE_BOUNDS
} from '@/components/store-map/mockData'
import { StoreMapScene } from '@/components/store-map/StoreMapScene'
import type { Product, Robot, RobotTask } from '@/components/store-map/types'
import { useWasmCompute } from '@/hooks/useWasmCompute'

export const Route = createFileRoute('/robots')({ component: RobotsMap })

function RobotsMap() {
  const [productCount, setProductCount] = useState(20000)
  const [robotCount, setRobotCount] = useState(30)
  const [sceneSeed, setSceneSeed] = useState(0)
  const [trackedRobotId, setTrackedRobotId] = useState<string | null>(null)
  const [sampleMagnitude, setSampleMagnitude] = useState<string | null>(null)
  const [controlsOpen, setControlsOpen] = useState(true)
  const [products, setProducts] = useState<Product[]>(() =>
    generateProducts(productCount)
  )
  const [initialRobots, setInitialRobots] = useState(() =>
    generateRobots(robotCount)
  )
  const [pickupProductId, setPickupProductId] = useState<string>('')
  const [dropAisle, setDropAisle] = useState(1)
  const [dropProgress, setDropProgress] = useState(50)
  const [activeCommand, setActiveCommand] = useState<RobotTask | null>(null)
  const [commandStatus, setCommandStatus] = useState<string | null>(null)
  const [trackedRobotState, setTrackedRobotState] = useState<Robot | null>(null)
  const productRangeId = useId()
  const robotRangeId = useId()
  const trackSelectId = useId()
  const pickupSelectId = useId()
  const dropAisleId = useId()
  const dropPosId = useId()
  const { ready: wasmReady, computeMagnitudes } = useWasmCompute()
  const aisleOptions = useMemo(
    () => Array.from({ length: AISLE_CONFIG.count }, (_, idx) => idx + 1),
    []
  )

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
    setProducts(generateProducts(productCount))
    setPickupProductId('')
    setActiveCommand(null)
  }, [productCount, robotCount, sceneSeed])

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

  useEffect(() => {
    if (pickupProductId) return
    const first = products[0]
    if (first) setPickupProductId(first.id)
  }, [pickupProductId, products])

  const handleReset = () => {
    setSceneSeed((prev) => prev + 1)
    setCommandStatus(null)
  }

  const computeDropTarget = (aisleNumber: number, positionPercent: number) => {
    const clampedAisle = Math.min(Math.max(aisleNumber, 1), AISLE_CONFIG.count)
    const ratio = Math.min(Math.max(positionPercent, 0), 100) / 100
    const x = getAisleCenterX(clampedAisle - 1)
    const y = -STORE_BOUNDS.height / 2 + 15 + ratio * (STORE_BOUNDS.height - 30)
    return { x, y }
  }

  const handleSendCommand = () => {
    const robotId = trackedRobotId ?? initialRobots[0]?.id
    const product = products.find((item) => item.id === pickupProductId)
    if (!robotId) {
      setCommandStatus('Please select a robot to send a command.')
      return
    }
    if (!product) {
      setCommandStatus(
        `Product "${pickupProductId}" not found. Check the ID and try again.`
      )
      return
    }

    const commandId = `cmd-${Date.now()}`
    const dropTarget = computeDropTarget(dropAisle, dropProgress)
    const newCommand: RobotTask = {
      id: commandId,
      robotId,
      productId: product.id,
      dropTarget,
      phase: 'toProduct',
      issuedAt: Date.now()
    }

    setActiveCommand(newCommand)
    const robotName =
      initialRobots.find((robot) => robot.id === robotId)?.name ?? robotId
    setCommandStatus(
      `Command sent to ${robotName}: fetch ${product.id} to aisle ${dropAisle}.`
    )
  }

  const handleCommandComplete = () => {
    setActiveCommand(null)
    setCommandStatus('Command completed.')
  }

  const liveCommandStatus = useMemo(() => {
    if (
      !activeCommand ||
      !trackedRobotState ||
      trackedRobotState.id !== activeCommand.robotId
    ) {
      return commandStatus
    }

    const task = trackedRobotState.task
    if (!task) return commandStatus

    if (task.phase === 'toProduct') {
      return `Heading to product ${task.productId}...`
    }

    if (task.phase === 'toDropoff') {
      const drop = activeCommand.dropTarget
      const label = trackedRobotState.carryingProductId ?? task.productId
      return `Carrying ${label} to drop (${drop.x.toFixed(0)}, ${drop.y.toFixed(0)})`
    }

    return commandStatus
  }, [activeCommand, commandStatus, trackedRobotState])

  return (
    <div className="relative w-full h-screen bg-slate-900">
      <Link
        to="/"
        className="absolute top-4 left-4 z-10 bg-slate-800/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-cyan-400 hover:text-cyan-300 hover:bg-slate-700/90 transition-colors font-semibold"
      >
        Home
      </Link>

      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        {!controlsOpen && (
          <button
            type="button"
            onClick={() => setControlsOpen(true)}
            className="bg-slate-800/90 backdrop-blur-sm px-3 py-2 rounded-md text-sm text-cyan-200 border border-slate-700 shadow-md hover:bg-slate-700/90 transition-colors cursor-pointer"
          >
            Open controls
          </button>
        )}

        {controlsOpen && (
          <div className="bg-slate-800/90 backdrop-blur-sm p-4 rounded-lg shadow-lg text-white w-80 max-w-[90vw]">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-cyan-400">
                Robots in store simulation
              </h2>
              <button
                type="button"
                aria-label="Minimize controls"
                onClick={() => setControlsOpen(false)}
                className="text-gray-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                ⎯
              </button>
            </div>

            <div className="space-y-3 text-sm mt-3">
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
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <label
                  htmlFor={robotRangeId}
                  className="block mb-1 text-gray-300"
                >
                  Robots: {robotCount}
                </label>
                <input
                  id={robotRangeId}
                  type="range"
                  min="1"
                  max="50"
                  value={robotCount}
                  onChange={(e) => setRobotCount(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <label
                  htmlFor={trackSelectId}
                  className="block mb-1 text-gray-300"
                >
                  Track robot
                </label>
                <select
                  id={trackSelectId}
                  value={trackedRobotId ?? ''}
                  onChange={(event) => {
                    const selected = event.target.value
                    setTrackedRobotId(selected || null)
                  }}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                >
                  <option value="">— None —</option>
                  {initialRobots.map((robot) => (
                    <option key={robot.id} value={robot.id}>
                      {robot.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Tracked robots are highlighted and labeled even in crowded
                  scenes.
                </p>
                {trackedRobotState && (
                  <div className="mt-2 p-2 rounded bg-slate-950/60 border border-slate-700/40">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Status:</span>
                      {trackedRobotState.carryingProductId ? (
                        <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          Carrying {trackedRobotState.carryingProductId}
                        </span>
                      ) : (
                        <span className="text-green-400">Available</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-md bg-slate-900/40 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-200 font-semibold text-sm">
                    Command robot
                  </span>
                  {liveCommandStatus && (
                    <span className="text-[11px] text-cyan-300">
                      {liveCommandStatus}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Uses the tracked robot: {trackedRobotId ?? 'None selected'}.
                </p>
                <div>
                  <label
                    htmlFor={pickupSelectId}
                    className="block mb-1 text-gray-300"
                  >
                    Pick up product
                  </label>
                  <div className="flex gap-2">
                    <input
                      id={pickupSelectId}
                      type="text"
                      value={pickupProductId}
                      onChange={(event) =>
                        setPickupProductId(event.target.value)
                      }
                      placeholder="Enter product ID (e.g., product-0)"
                      className="flex-1 bg-slate-900/60 border border-slate-700 rounded px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const randomIndex = Math.floor(
                          Math.random() * products.length
                        )
                        setPickupProductId(products[randomIndex]?.id ?? '')
                      }}
                      className="px-3 py-2 bg-slate-700/60 hover:bg-slate-600/60 border border-slate-600 rounded text-xs text-gray-300 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Random
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Total products: {products.length.toLocaleString()}. Enter
                    any product ID.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor={dropAisleId}
                      className="block mb-1 text-gray-300"
                    >
                      Drop aisle
                    </label>
                    <select
                      id={dropAisleId}
                      value={dropAisle}
                      onChange={(event) =>
                        setDropAisle(Number(event.target.value))
                      }
                      className="w-full bg-slate-900/60 border border-slate-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                    >
                      {aisleOptions.map((value) => (
                        <option key={value} value={value}>
                          Aisle {value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor={dropPosId}
                      className="block mb-1 text-gray-300"
                    >
                      Aisle position
                    </label>
                    <input
                      id={dropPosId}
                      type="range"
                      min="0"
                      max="100"
                      value={dropProgress}
                      onChange={(event) =>
                        setDropProgress(Number(event.target.value))
                      }
                      className="w-full cursor-pointer"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      {dropProgress}% along aisle
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSendCommand}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  disabled={!products.length || !pickupProductId}
                >
                  Send pickup command
                </button>
              </div>
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

            <button
              type="button"
              onClick={handleReset}
              className="mt-3 w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded transition-colors cursor-pointer"
            >
              Reset Positions
            </button>
          </div>
        )}
      </div>

      <StoreMapScene
        key={sceneSeed}
        productCount={productCount}
        robotCount={robotCount}
        initialRobots={initialRobots}
        trackedRobotId={trackedRobotId}
        products={products}
        activeCommand={activeCommand}
        onCommandComplete={handleCommandComplete}
        onTrackedRobotUpdate={(robot) => setTrackedRobotState(robot ?? null)}
      />
    </div>
  )
}
