export type WasmApi = {
  magnitudes: (buffer: Float32Array) => Float32Array | number[]
  dotProducts: (a: Float32Array, b: Float32Array) => Float32Array | number[]
  lerpVectors: (
    a: Float32Array,
    b: Float32Array,
    t: number
  ) => Float32Array | number[]
  computePath: (
    start: Float32Array,
    end: Float32Array,
    config: Float32Array,
    preferOuterWalkway: boolean
  ) => Float32Array | number[]
  updateRobots: (
    robots: Float32Array,
    products: Float32Array,
    config: Float32Array,
    deltaMs: number
  ) => Float32Array | number[]
  moveRobotToWaypoint: (
    robotData: Float32Array,
    config: Float32Array
  ) => Float32Array | number[]
  moveRobotToWaypointWithProducts?: (
    robotData: Float32Array,
    products: Float32Array,
    config: Float32Array
  ) => Float32Array | number[]
  hasArrivedAtWaypoint: (
    positions: Float32Array,
    config: Float32Array
  ) => number
}

let wasmModulePromise: Promise<WasmApi> | null = null

export async function loadWasm(): Promise<WasmApi> {
  if (!wasmModulePromise) {
    wasmModulePromise = import('@/wasm/pkg/three_sim_wasm')
      .then(async (mod) => {
        const wasmMod = mod as unknown as {
          default?: () => Promise<unknown>
          magnitudes: WasmApi['magnitudes']
          dot_products: WasmApi['dotProducts']
          lerp_vectors: WasmApi['lerpVectors']
          compute_path: WasmApi['computePath']
          update_robots: WasmApi['updateRobots']
          move_robot_to_waypoint: WasmApi['moveRobotToWaypoint']
          move_robot_to_waypoint_with_products?: WasmApi['moveRobotToWaypointWithProducts']
          has_arrived_at_waypoint: WasmApi['hasArrivedAtWaypoint']
        }

        if (typeof wasmMod.default === 'function') {
          await wasmMod.default()
        }

        return {
          magnitudes: wasmMod.magnitudes,
          dotProducts: wasmMod.dot_products,
          lerpVectors: wasmMod.lerp_vectors,
          computePath: wasmMod.compute_path,
          updateRobots: wasmMod.update_robots,
          moveRobotToWaypoint: wasmMod.move_robot_to_waypoint,
          moveRobotToWaypointWithProducts:
            wasmMod.move_robot_to_waypoint_with_products,
          hasArrivedAtWaypoint: wasmMod.has_arrived_at_waypoint
        }
      })
      .catch(async () => {
        // Fallback to stubbed JS implementation if wasm-pack output is missing
        const stub = (await import('@/wasm/pkg')) as unknown as {
          default?: () => Promise<unknown>
          magnitudes: WasmApi['magnitudes']
          dotProducts: WasmApi['dotProducts']
          lerpVectors: WasmApi['lerpVectors']
          computePath: WasmApi['computePath']
          updateRobots: WasmApi['updateRobots']
          moveRobotToWaypoint: WasmApi['moveRobotToWaypoint']
          moveRobotToWaypointWithProducts?: WasmApi['moveRobotToWaypointWithProducts']
          hasArrivedAtWaypoint: WasmApi['hasArrivedAtWaypoint']
        }

        if (typeof stub.default === 'function') {
          await stub.default()
        }

        return {
          magnitudes: stub.magnitudes,
          dotProducts: stub.dotProducts,
          lerpVectors: stub.lerpVectors,
          computePath: stub.computePath,
          updateRobots: stub.updateRobots,
          moveRobotToWaypoint: stub.moveRobotToWaypoint,
          moveRobotToWaypointWithProducts: stub.moveRobotToWaypointWithProducts,
          hasArrivedAtWaypoint: stub.hasArrivedAtWaypoint
        }
      })
  }

  return wasmModulePromise
}
