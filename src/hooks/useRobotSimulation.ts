import { useEffect, useRef, useState } from 'react'
import { STORE_BOUNDS } from '@/components/store-map/mockData'
import type {
  Product,
  Robot,
  RobotTask,
  RobotTaskPhase
} from '@/components/store-map/types'
import { loadWasm } from '@/wasm/loadWasm'

const UPDATE_INTERVAL = 50

function flattenRobots(robots: Robot[]) {
  const data = new Float32Array(robots.length * 7)
  robots.forEach((robot, idx) => {
    const offset = idx * 7
    data[offset] = robot.x
    data[offset + 1] = robot.y
    data[offset + 2] = robot.destX
    data[offset + 3] = robot.destY
    data[offset + 4] = robot.orientation
    data[offset + 5] = robot.speed
    data[offset + 6] = robot.lastMoveTime ?? 0
  })
  return data
}

function flattenProducts(products: Product[]) {
  const data = new Float32Array(products.length * 2)
  products.forEach((product, idx) => {
    const offset = idx * 2
    data[offset] = product.x
    data[offset + 1] = product.y
  })
  return data
}

function inflateRobots(robots: Robot[], updated: Float32Array | number[]) {
  const arr =
    updated instanceof Float32Array ? updated : new Float32Array(updated)
  const next: Robot[] = []

  for (let i = 0; i < robots.length; i++) {
    const offset = i * 7
    next.push({
      ...robots[i],
      x: arr[offset],
      y: arr[offset + 1],
      destX: arr[offset + 2],
      destY: arr[offset + 3],
      orientation: arr[offset + 4],
      speed: arr[offset + 5],
      lastMoveTime: arr[offset + 6]
    })
  }

  return next
}

function computePath(
  wasmModule: Awaited<ReturnType<typeof loadWasm>>,
  robot: Robot,
  target: { x: number; y: number },
  preferOuterWalkway: boolean
): { x: number; y: number }[] {
  const start = new Float32Array([robot.x, robot.y])
  const end = new Float32Array([target.x, target.y])
  const bounds = new Float32Array([STORE_BOUNDS.width, STORE_BOUNDS.height])
  const result = wasmModule.computePath(start, end, bounds, preferOuterWalkway)
  const arr =
    result instanceof Float32Array ? result : new Float32Array(result ?? [])
  if (arr.length % 2 !== 0 || arr.length === 0) {
    return [{ x: robot.x, y: robot.y }, target]
  }
  const waypoints: { x: number; y: number }[] = []
  for (let i = 0; i < arr.length; i += 2) {
    waypoints.push({ x: arr[i], y: arr[i + 1] })
  }
  return waypoints
}

function moveRobotToWaypoint(
  wasmModule: Awaited<ReturnType<typeof loadWasm>>,
  robot: Robot,
  waypoint: { x: number; y: number }
): Robot {
  const robotData = new Float32Array([
    robot.x,
    robot.y,
    robot.destX,
    robot.destY,
    robot.orientation,
    robot.speed,
    robot.lastMoveTime ?? 0,
    waypoint.x,
    waypoint.y,
    UPDATE_INTERVAL
  ])
  const result = wasmModule.moveRobotToWaypoint(robotData)
  if (result.length < 3) return robot
  return {
    ...robot,
    x: result[0],
    y: result[1],
    orientation: result[2]
  }
}

function hasArrivedAtWaypoint(
  wasmModule: Awaited<ReturnType<typeof loadWasm>>,
  robot: Robot,
  waypoint: { x: number; y: number }
): boolean {
  const positions = new Float32Array([robot.x, robot.y, waypoint.x, waypoint.y])
  const result = wasmModule.hasArrivedAtWaypoint(positions)
  return result === 1.0
}

export function useRobotSimulation(
  initialRobots: Robot[],
  products: Product[],
  activeCommand?: RobotTask | null,
  onCommandComplete?: (commandId: string) => void
) {
  const [robots, setRobots] = useState<Robot[]>(initialRobots)
  const [wasmModule, setWasmModule] = useState<Awaited<
    ReturnType<typeof loadWasm>
  > | null>(null)
  const productLookup = useRef(
    new Map(products.map((product) => [product.id, product]))
  )

  useEffect(() => {
    productLookup.current = new Map(
      products.map((product) => [product.id, product])
    )
  }, [products])

  useEffect(() => {
    loadWasm()
      .then(setWasmModule)
      .catch((error: Error) => {
        console.error('Failed to load WASM module', error)
        throw new Error('WASM module is required for robot simulation')
      })
  }, [])

  useEffect(() => {
    if (!wasmModule) return

    const intervalId = setInterval(() => {
      setRobots((currentRobots) => {
        const commandRobotId = activeCommand?.robotId ?? null
        const withCommands = activeCommand
          ? currentRobots.map((robot) => {
              if (robot.id !== activeCommand.robotId) return robot
              const existingTask =
                robot.task?.id === activeCommand.id
                  ? robot.task
                  : { ...activeCommand, phase: 'toProduct' as RobotTaskPhase }

              const pickup = productLookup.current.get(existingTask.productId)
              const target =
                existingTask.phase === 'toProduct'
                  ? pickup
                  : existingTask.dropTarget

              if (!target) return robot

              const currentTargetKey =
                existingTask.phase === 'toProduct'
                  ? `product-${existingTask.productId}`
                  : `drop-${existingTask.productId}`

              const shouldPlanPath =
                !existingTask.waypoints ||
                existingTask.waypointIndex === undefined ||
                existingTask.waypoints.length === 0 ||
                existingTask.waypointIndex >= existingTask.waypoints.length ||
                existingTask.waypointsTarget !== currentTargetKey

              const plannedPath = shouldPlanPath
                ? computePath(wasmModule, robot, target, true)
                : null

              const waypoints = shouldPlanPath
                ? plannedPath
                : existingTask.waypoints
              const waypointIndex = shouldPlanPath
                ? 0
                : (existingTask.waypointIndex ?? 0)
              const waypoint = waypoints?.[waypointIndex] ?? target

              return {
                ...robot,
                task: {
                  ...existingTask,
                  waypoints,
                  waypointIndex,
                  waypointsTarget: currentTargetKey
                } as RobotTask,
                destX: waypoint.x,
                destY: waypoint.y
              }
            })
          : currentRobots

        const autopilotRobots = withCommands.filter(
          (robot) => robot.id !== commandRobotId
        )

        let nextRobots = withCommands

        if (autopilotRobots.length > 0) {
          const robotBuffer = flattenRobots(autopilotRobots)
          const productBuffer = flattenProducts(products)
          const bounds = new Float32Array([
            STORE_BOUNDS.width,
            STORE_BOUNDS.height
          ])
          const result = wasmModule.updateRobots(
            robotBuffer,
            productBuffer,
            bounds,
            UPDATE_INTERVAL
          )
          if (result && result.length === robotBuffer.length) {
            const inflated = inflateRobots(autopilotRobots, result)
            let inflateIndex = 0
            nextRobots = withCommands.map((robot) =>
              robot.id === commandRobotId ? robot : inflated[inflateIndex++]
            )
          }
        }

        if (activeCommand && commandRobotId) {
          nextRobots = nextRobots.map((robot) => {
            if (robot.id !== commandRobotId) return robot
            const waypoints = robot.task?.waypoints
            const waypointIndex = robot.task?.waypointIndex ?? 0
            const waypoint = (waypoints && Array.isArray(waypoints)
              ? waypoints[waypointIndex]
              : null) ??
              robot.task?.dropTarget ?? { x: robot.destX, y: robot.destY }
            return moveRobotToWaypoint(wasmModule, robot, waypoint)
          })
        }

        return nextRobots.map((robot) => {
          if (!robot.task) return robot

          const pickup = productLookup.current.get(robot.task.productId)
          const target =
            robot.task.phase === 'toProduct' ? pickup : robot.task.dropTarget

          if (!target) {
            return { ...robot, task: undefined, carryingProductId: undefined }
          }

          const taskWaypoints = robot.task.waypoints
          const taskWaypointIndex = robot.task.waypointIndex ?? 0
          const waypoint =
            (taskWaypoints && Array.isArray(taskWaypoints)
              ? taskWaypoints[taskWaypointIndex]
              : null) ?? target

          if (hasArrivedAtWaypoint(wasmModule, robot, waypoint)) {
            if (
              robot.task.waypoints &&
              (robot.task.waypointIndex ?? 0) < robot.task.waypoints.length - 1
            ) {
              const nextIndex = (robot.task.waypointIndex ?? 0) + 1
              const nextWaypoint = robot.task.waypoints[nextIndex]
              return {
                ...robot,
                task: { ...robot.task, waypointIndex: nextIndex } as RobotTask,
                destX: nextWaypoint.x,
                destY: nextWaypoint.y
              }
            }

            if (robot.task.phase === 'toProduct') {
              const dropPath = computePath(
                wasmModule,
                robot,
                robot.task.dropTarget,
                true
              )
              const firstDropWaypoint = dropPath[0] ?? robot.task.dropTarget
              return {
                ...robot,
                carryingProductId: robot.task.productId,
                task: {
                  ...robot.task,
                  phase: 'toDropoff' as RobotTaskPhase,
                  waypoints: dropPath,
                  waypointIndex: 0,
                  waypointsTarget: `drop-${robot.task.productId}`
                },
                destX: firstDropWaypoint.x,
                destY: firstDropWaypoint.y
              }
            }

            if (robot.task.phase === 'toDropoff') {
              onCommandComplete?.(robot.task.id)
              return {
                ...robot,
                carryingProductId: undefined,
                task: undefined
              }
            }
          }

          return {
            ...robot,
            destX: target.x,
            destY: target.y
          }
        })
      })
    }, UPDATE_INTERVAL)

    return () => clearInterval(intervalId)
  }, [activeCommand, onCommandComplete, products, wasmModule])

  useEffect(() => {
    setRobots(initialRobots)
  }, [initialRobots])

  return robots
}
