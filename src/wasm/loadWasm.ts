export type WasmApi = {
  magnitudes: (buffer: Float32Array) => Float32Array | number[]
  dotProducts: (a: Float32Array, b: Float32Array) => Float32Array | number[]
  lerpVectors: (
    a: Float32Array,
    b: Float32Array,
    t: number
  ) => Float32Array | number[]
  updateRobots?: (
    robots: Float32Array,
    products: Float32Array,
    bounds: Float32Array,
    deltaMs: number
  ) => Float32Array | number[]
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
          update_robots?: WasmApi['updateRobots']
        }

        if (typeof wasmMod.default === 'function') {
          await wasmMod.default()
        }

        return {
          magnitudes: wasmMod.magnitudes,
          dotProducts: wasmMod.dot_products,
          lerpVectors: wasmMod.lerp_vectors,
          updateRobots: wasmMod.update_robots
        }
      })
      .catch(async () => {
        // Fallback to stubbed JS implementation if wasm-pack output is missing
        const stub = (await import('@/wasm/pkg')) as unknown as {
          default?: () => Promise<unknown>
          magnitudes: WasmApi['magnitudes']
          dotProducts: WasmApi['dotProducts']
          lerpVectors: WasmApi['lerpVectors']
          updateRobots?: WasmApi['updateRobots']
        }

        if (typeof stub.default === 'function') {
          await stub.default()
        }

        return {
          magnitudes: stub.magnitudes,
          dotProducts: stub.dotProducts,
          lerpVectors: stub.lerpVectors,
          updateRobots: stub.updateRobots
        }
      })
  }

  return wasmModulePromise
}
