import { useEffect, useMemo, useState } from 'react'
import { loadWasm, type WasmApi } from '@/wasm/loadWasm'

export function useWasmCompute() {
  const [module, setModule] = useState<WasmApi | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWasm()
      .then(setModule)
      .catch((err: Error) => {
        console.error('Failed to load WASM module', err)
        setError('Failed to load WASM module')
      })
  }, [])

  const computeMagnitudes = useMemo(() => {
    if (!module) return null

    return (buffer: Float32Array) => {
      const result = module.magnitudes(buffer)
      return result instanceof Float32Array ? result : new Float32Array(result)
    }
  }, [module])

  const computeDotProducts = useMemo(() => {
    if (!module) return null

    return (a: Float32Array, b: Float32Array) => {
      const result = module.dotProducts(a, b)
      return result instanceof Float32Array ? result : new Float32Array(result)
    }
  }, [module])

  const computeLerpVectors = useMemo(() => {
    if (!module) return null

    return (a: Float32Array, b: Float32Array, t: number) => {
      const result = module.lerpVectors(a, b, t)
      return result instanceof Float32Array ? result : new Float32Array(result)
    }
  }, [module])

  return {
    ready: !!module && !error,
    error,
    computeMagnitudes,
    computeDotProducts,
    computeLerpVectors
  }
}
