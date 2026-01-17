import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import {
  generateProducts,
  generateRobots,
  getAisleCenterCoord,
  transformPosition
} from '@/components/store-map/mockData'
import { StoreMapScene } from '@/components/store-map/StoreMapScene'
import type {
  AisleConfig,
  Product,
  Robot,
  RobotTask
} from '@/components/store-map/types'
import {
  AISLE_CONFIG_CONSTRAINTS,
  calculateRequiredStoreWidth,
  DEFAULT_AISLE_CONFIG,
  validateAndAdjustAisleConfig,
  willAislesFit
} from '@/components/store-map/types'
import {
  getProducts,
  getSimulationConfig,
  resetSimulation,
  saveSimulation
} from '@/graphql/client'
import { useWasmCompute } from '@/hooks/useWasmCompute'

type LoaderData = {
  productCount: number
  robotCount: number
  trackedRobotId: string | null
  pickupProductId: string | null
  dropAisle: number | null
  dropProgress: number | null
  aisleConfig: AisleConfig
  products: Product[]
  isPersisted: boolean
}

export const Route = createFileRoute('/robots')({
  component: RobotsMap,
  loader: async (): Promise<LoaderData> => {
    try {
      const [config, products] = await Promise.all([
        getSimulationConfig(),
        getProducts()
      ])

      if (
        config &&
        products.length > 0 &&
        products.length === config.productCount
      ) {
        const aisleConfig: AisleConfig = {
          count: config.aisleCount ?? DEFAULT_AISLE_CONFIG.count,
          spacing: config.aisleSpacing ?? DEFAULT_AISLE_CONFIG.spacing,
          width: config.aisleWidth ?? DEFAULT_AISLE_CONFIG.width,
          startOffset: config.startOffset ?? DEFAULT_AISLE_CONFIG.startOffset,
          walkwayWidth:
            config.walkwayWidth ?? DEFAULT_AISLE_CONFIG.walkwayWidth,
          crossAisleBuffer:
            config.crossAisleBuffer ?? DEFAULT_AISLE_CONFIG.crossAisleBuffer,
          outerWalkwayOffset:
            config.outerWalkwayOffset ??
            DEFAULT_AISLE_CONFIG.outerWalkwayOffset,
          storeWidth: config.storeWidth ?? DEFAULT_AISLE_CONFIG.storeWidth,
          storeHeight: config.storeHeight ?? DEFAULT_AISLE_CONFIG.storeHeight,
          orientation:
            (config.orientation as 'vertical' | 'horizontal') ??
            DEFAULT_AISLE_CONFIG.orientation
        }

        return {
          productCount: config.productCount,
          robotCount: config.robotCount,
          trackedRobotId: config.trackedRobotId,
          pickupProductId: config.pickupProductId,
          dropAisle: config.dropAisle,
          dropProgress: config.dropProgress,
          aisleConfig,
          products: products as Product[],
          isPersisted: true
        }
      }
    } catch (error) {
      console.error('Failed to load persisted data:', error)
    }

    const defaultProductCount = 20000
    const defaultRobotCount = 30

    return {
      productCount: defaultProductCount,
      robotCount: defaultRobotCount,
      trackedRobotId: null,
      pickupProductId: null,
      dropAisle: null,
      dropProgress: null,
      aisleConfig: DEFAULT_AISLE_CONFIG,
      products: generateProducts(defaultProductCount),
      isPersisted: false
    }
  }
})

function RobotsMap() {
  const loaderData = Route.useLoaderData()
  const [productCount, setProductCount] = useState(loaderData.productCount)
  const [robotCount, setRobotCount] = useState(loaderData.robotCount)
  const [sceneSeed, setSceneSeed] = useState(0)
  const [trackedRobotId, setTrackedRobotId] = useState<string | null>(
    loaderData.trackedRobotId
  )
  const [followTrackedRobot, setFollowTrackedRobot] = useState(false)
  const [sampleMagnitude, setSampleMagnitude] = useState<string | null>(null)
  const [controlsOpen, setControlsOpen] = useState(true)
  const [aisleConfig, setAisleConfig] = useState<AisleConfig>(
    loaderData.aisleConfig
  )
  const [layoutSeed, setLayoutSeed] = useState(0)
  const [products, setProducts] = useState<Product[]>(loaderData.products)
  const [initialRobots, setInitialRobots] = useState(() =>
    generateRobots(loaderData.robotCount, loaderData.aisleConfig)
  )
  const [pickupProductId, setPickupProductId] = useState<string>(
    loaderData.pickupProductId || ''
  )
  const [dropAisle, setDropAisle] = useState(loaderData.dropAisle || 1)
  const [dropProgress, setDropProgress] = useState(
    loaderData.dropProgress || 50
  )
  const [activeCommand, setActiveCommand] = useState<RobotTask | null>(null)
  const [commandStatus, setCommandStatus] = useState<string | null>(null)
  const [trackedRobotState, setTrackedRobotState] = useState<Robot | null>(null)
  const [isPersisted, setIsPersisted] = useState(loaderData.isPersisted)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [layoutConfigOpen, setLayoutConfigOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() => ({
    productCount: loaderData.productCount,
    robotCount: loaderData.robotCount,
    trackedRobotId: loaderData.trackedRobotId,
    pickupProductId: loaderData.pickupProductId ?? '',
    dropAisle: loaderData.dropAisle ?? 1,
    dropProgress: loaderData.dropProgress ?? 50,
    aisleConfig: loaderData.aisleConfig
  }))
  const productRangeId = useId()
  const robotRangeId = useId()
  const trackSelectId = useId()
  const followRobotId = useId()
  const pickupSelectId = useId()
  const pickupListId = useId()
  const dropAisleId = useId()
  const dropPosId = useId()
  const aisleCountId = useId()
  const aisleSpacingId = useId()
  const aisleWidthId = useId()
  const storeWidthId = useId()
  const storeHeightId = useId()
  const { ready: wasmReady, computeMagnitudes } = useWasmCompute()
  const aisleOptions = useMemo(
    () => Array.from({ length: aisleConfig.count }, (_, idx) => idx + 1),
    [aisleConfig.count]
  )
  const pickupSuggestions = useMemo(() => {
    if (!products.length) return []
    const maxSuggestions = 200
    const trimmed = pickupProductId.trim()
    const match = trimmed.match(/^product-(\d+)/i)
    if (match) {
      const index = Number(match[1])
      if (!Number.isNaN(index)) {
        const start = Math.max(0, index - Math.floor(maxSuggestions / 2))
        const end = Math.min(products.length, start + maxSuggestions)
        return products.slice(start, end)
      }
    }
    return products.slice(0, Math.min(products.length, maxSuggestions))
  }, [pickupProductId, products])

  useEffect(() => {
    if (!wasmReady || !computeMagnitudes) return
    const demo = new Float32Array([3, 4, 0]) // length should be 5
    const result = computeMagnitudes(demo)
    setSampleMagnitude(result[0]?.toFixed(2) ?? null)
  }, [computeMagnitudes, wasmReady])

  useEffect(() => {
    if (!trackedRobotId) {
      setFollowTrackedRobot(false)
    }
  }, [trackedRobotId])

  const updateAisleConfig = useCallback((updates: Partial<AisleConfig>) => {
    setAisleConfig((prev) => {
      const updated = { ...prev, ...updates }
      return validateAndAdjustAisleConfig(updated)
    })
    setTimeout(() => {
      setLayoutSeed((prev) => prev + 1)
    }, 300)
  }, [])

  useEffect(() => {
    // Re-roll robots when sceneSeed changes, even if the count stays the same
    void sceneSeed
    void layoutSeed
    setInitialRobots(generateRobots(robotCount, aisleConfig))
    setProducts(generateProducts(productCount, aisleConfig))
    setPickupProductId('')
    setActiveCommand(null)
  }, [productCount, robotCount, sceneSeed, layoutSeed, aisleConfig])

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

  const handleSaveConfiguration = async () => {
    setIsSaving(true)
    setSaveStatus(null)

    try {
      const result: { success: boolean; message: string | null } =
        await saveSimulation({
          productCount,
          robotCount,
          trackedRobotId,
          pickupProductId: pickupProductId || null,
          dropAisle,
          dropProgress,
          aisleCount: aisleConfig.count,
          aisleSpacing: aisleConfig.spacing,
          aisleWidth: aisleConfig.width,
          startOffset: aisleConfig.startOffset,
          walkwayWidth: aisleConfig.walkwayWidth,
          crossAisleBuffer: aisleConfig.crossAisleBuffer,
          outerWalkwayOffset: aisleConfig.outerWalkwayOffset,
          storeWidth: aisleConfig.storeWidth,
          storeHeight: aisleConfig.storeHeight,
          orientation: aisleConfig.orientation,
          products
        })

      if (result.success) {
        setSaveStatus('Configuration saved successfully!')
        setIsPersisted(true)
        setLastSavedSnapshot({
          productCount,
          robotCount,
          trackedRobotId,
          pickupProductId,
          dropAisle,
          dropProgress,
          aisleConfig
        })
      } else {
        setSaveStatus(`Save failed: ${result.message}`)
      }
    } catch (error) {
      setSaveStatus(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetToDefaults = async () => {
    try {
      await resetSimulation()
      window.location.reload()
    } catch (error) {
      setSaveStatus(
        `Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const computeDropTarget = (aisleNumber: number, positionPercent: number) => {
    const clampedAisle = Math.min(Math.max(aisleNumber, 1), aisleConfig.count)
    const ratio = Math.min(Math.max(positionPercent, 0), 100) / 100
    const x = getAisleCenterCoord(clampedAisle - 1, aisleConfig)
    const y =
      -aisleConfig.storeHeight / 2 + 15 + ratio * (aisleConfig.storeHeight - 30)
    return transformPosition(x, y, aisleConfig.orientation)
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
      return `Heading to ${task.productId}...`
    }

    if (task.phase === 'toDropoff') {
      const drop = activeCommand.dropTarget
      const label = trackedRobotState.carryingProductId ?? task.productId
      return `Carrying ${label} to drop (${drop.x.toFixed(0)}, ${drop.y.toFixed(0)})`
    }

    return commandStatus
  }, [activeCommand, commandStatus, trackedRobotState])

  const hasUnsavedChanges = useMemo(() => {
    const current = {
      productCount,
      robotCount,
      trackedRobotId,
      pickupProductId,
      dropAisle,
      dropProgress,
      aisleConfig
    }

    if (current.productCount !== lastSavedSnapshot.productCount) return true
    if (current.robotCount !== lastSavedSnapshot.robotCount) return true
    if (current.trackedRobotId !== lastSavedSnapshot.trackedRobotId) return true
    if (current.pickupProductId !== lastSavedSnapshot.pickupProductId) {
      return true
    }
    if (current.dropAisle !== lastSavedSnapshot.dropAisle) return true
    if (current.dropProgress !== lastSavedSnapshot.dropProgress) return true

    const prevAisle = lastSavedSnapshot.aisleConfig
    const nextAisle = current.aisleConfig
    return (
      prevAisle.count !== nextAisle.count ||
      prevAisle.spacing !== nextAisle.spacing ||
      prevAisle.width !== nextAisle.width ||
      prevAisle.startOffset !== nextAisle.startOffset ||
      prevAisle.walkwayWidth !== nextAisle.walkwayWidth ||
      prevAisle.crossAisleBuffer !== nextAisle.crossAisleBuffer ||
      prevAisle.outerWalkwayOffset !== nextAisle.outerWalkwayOffset ||
      prevAisle.storeWidth !== nextAisle.storeWidth ||
      prevAisle.storeHeight !== nextAisle.storeHeight ||
      prevAisle.orientation !== nextAisle.orientation
    )
  }, [
    aisleConfig,
    dropAisle,
    dropProgress,
    lastSavedSnapshot,
    pickupProductId,
    productCount,
    robotCount,
    trackedRobotId
  ])

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
          <div className="bg-slate-800/90 backdrop-blur-sm p-4 rounded-lg shadow-lg text-white w-80 max-w-[90vw] max-h-[calc(100vh-2rem)] overflow-y-auto">
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

            <div className="mt-3 mb-4 p-3 bg-slate-950/60 rounded border border-slate-700/40">
              <div className="text-xs font-semibold text-cyan-300 mb-2">
                Camera Controls
              </div>
              <div className="text-xs space-y-1 text-gray-300">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0">Orbit:</span>
                  <span>Left click + drag</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0">Pan:</span>
                  <span>Right click + drag</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0">Zoom:</span>
                  <span>Scroll wheel</span>
                </div>
              </div>
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
                <label
                  htmlFor={followRobotId}
                  className="mt-2 flex items-center gap-2 text-xs text-gray-300"
                >
                  <input
                    id={followRobotId}
                    type="checkbox"
                    checked={followTrackedRobot}
                    onChange={(event) =>
                      setFollowTrackedRobot(event.target.checked)
                    }
                    disabled={!trackedRobotId}
                    className="h-3 w-3 rounded border-slate-600 bg-slate-900/60 text-cyan-400 focus:ring-cyan-500 disabled:opacity-50"
                  />
                  Follow tracked robot
                </label>
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

              <details
                open={layoutConfigOpen}
                onToggle={(e) =>
                  setLayoutConfigOpen((e.target as HTMLDetailsElement).open)
                }
                className="p-3 rounded-md bg-slate-900/40 border border-slate-700/60 open:space-y-3"
              >
                <summary className="flex items-center justify-between cursor-pointer text-gray-200 font-semibold text-sm hover:text-cyan-300 transition-colors mb-0">
                  <span>Store Layout Configuration</span>
                  <span className="text-xs text-gray-400">
                    {layoutConfigOpen ? 'Hide' : 'Show'}
                  </span>
                </summary>
                <p className="text-xs text-gray-400">
                  Adjust aisle layout in real-time
                </p>
                <div className="text-xs bg-slate-950/60 p-2 rounded border border-slate-700/40">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Store size:</span>
                    <span className="text-cyan-300">
                      {aisleConfig.storeWidth} × {aisleConfig.storeHeight}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-400">Required:</span>
                    <span
                      className={
                        willAislesFit(aisleConfig)
                          ? 'text-green-400'
                          : 'text-amber-400'
                      }
                    >
                      {calculateRequiredStoreWidth(aisleConfig).toFixed(0)} wide
                    </span>
                  </div>
                  {!willAislesFit(aisleConfig) && (
                    <div className="mt-2 text-amber-400 flex items-start gap-1">
                      <span>⚠</span>
                      <span>Store will auto-expand to fit aisles</span>
                    </div>
                  )}
                </div>
                <div>
                  <label
                    htmlFor={aisleCountId}
                    className="block mb-1 text-gray-300"
                  >
                    Aisles: {aisleConfig.count}
                  </label>
                  <input
                    id={aisleCountId}
                    type="range"
                    min={AISLE_CONFIG_CONSTRAINTS.count.min}
                    max={AISLE_CONFIG_CONSTRAINTS.count.max}
                    value={aisleConfig.count}
                    onChange={(e) =>
                      updateAisleConfig({ count: Number(e.target.value) })
                    }
                    className="w-full cursor-pointer"
                  />
                </div>
                <div>
                  <label
                    htmlFor={aisleSpacingId}
                    className="block mb-1 text-gray-300"
                  >
                    Spacing: {aisleConfig.spacing}
                  </label>
                  <input
                    id={aisleSpacingId}
                    type="range"
                    min={AISLE_CONFIG_CONSTRAINTS.spacing.min}
                    max={AISLE_CONFIG_CONSTRAINTS.spacing.max}
                    value={aisleConfig.spacing}
                    onChange={(e) =>
                      updateAisleConfig({ spacing: Number(e.target.value) })
                    }
                    className="w-full cursor-pointer"
                  />
                </div>
                <div>
                  <label
                    htmlFor={aisleWidthId}
                    className="block mb-1 text-gray-300"
                  >
                    Width: {aisleConfig.width}
                  </label>
                  <input
                    id={aisleWidthId}
                    type="range"
                    min={AISLE_CONFIG_CONSTRAINTS.width.min}
                    max={AISLE_CONFIG_CONSTRAINTS.width.max}
                    value={aisleConfig.width}
                    onChange={(e) =>
                      updateAisleConfig({ width: Number(e.target.value) })
                    }
                    className="w-full cursor-pointer"
                  />
                </div>
                <details
                  open={advancedOpen}
                  onToggle={(e) =>
                    setAdvancedOpen((e.target as HTMLDetailsElement).open)
                  }
                  className="mt-3"
                >
                  <summary className="cursor-pointer text-sm text-gray-300 hover:text-cyan-400 transition-colors">
                    Advanced Store Settings
                  </summary>
                  <div className="mt-3 space-y-3 pl-2">
                    <div>
                      <label
                        htmlFor={storeWidthId}
                        className="block mb-1 text-gray-300"
                      >
                        Store Width: {aisleConfig.storeWidth}
                      </label>
                      <input
                        id={storeWidthId}
                        type="range"
                        min={AISLE_CONFIG_CONSTRAINTS.storeWidth.min}
                        max={AISLE_CONFIG_CONSTRAINTS.storeWidth.max}
                        step="10"
                        value={aisleConfig.storeWidth}
                        onChange={(e) =>
                          updateAisleConfig({
                            storeWidth: Number(e.target.value)
                          })
                        }
                        className="w-full cursor-pointer"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={storeHeightId}
                        className="block mb-1 text-gray-300"
                      >
                        Store Height: {aisleConfig.storeHeight}
                      </label>
                      <input
                        id={storeHeightId}
                        type="range"
                        min={AISLE_CONFIG_CONSTRAINTS.storeHeight.min}
                        max={AISLE_CONFIG_CONSTRAINTS.storeHeight.max}
                        step="10"
                        value={aisleConfig.storeHeight}
                        onChange={(e) =>
                          updateAisleConfig({
                            storeHeight: Number(e.target.value)
                          })
                        }
                        className="w-full cursor-pointer"
                      />
                    </div>
                  </div>
                </details>
              </details>

              <details
                open={commandOpen}
                onToggle={(e) =>
                  setCommandOpen((e.target as HTMLDetailsElement).open)
                }
                className="p-3 rounded-md bg-slate-900/40 border border-slate-700/60 open:space-y-3"
              >
                <summary className="flex items-center justify-between cursor-pointer text-gray-200 font-semibold text-sm hover:text-cyan-300 transition-colors mb-0">
                  <span>Command robot</span>
                  {liveCommandStatus ? (
                    <span className="text-[11px] text-cyan-300">
                      {liveCommandStatus}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {commandOpen ? 'Hide' : 'Show'}
                    </span>
                  )}
                </summary>
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
                      list={pickupListId}
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
                  <datalist id={pickupListId}>
                    {pickupSuggestions.map((product) => (
                      <option key={product.id} value={product.id} />
                    ))}
                  </datalist>
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
              </details>
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

            <button
              type="button"
              onClick={handleSaveConfiguration}
              disabled={isSaving || !hasUnsavedChanges}
              className="mt-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>

            {saveStatus && (
              <p className="mt-2 text-xs text-cyan-300">{saveStatus}</p>
            )}

            {isPersisted && (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                <span>✓</span>
                <span>Using saved configuration</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleResetToDefaults}
              className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition-colors cursor-pointer"
            >
              Reset to Defaults
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
        followTrackedRobot={followTrackedRobot}
        products={products}
        activeCommand={activeCommand}
        onCommandComplete={handleCommandComplete}
        onTrackedRobotUpdate={(robot) => setTrackedRobotState(robot ?? null)}
        aisleConfig={aisleConfig}
      />
    </div>
  )
}
