import { useEffect, useState } from 'react'
import { STORE_BOUNDS } from '@/components/store-map/mockData'
import type { Product, Robot } from '@/components/store-map/types'
import { loadWasm } from '@/wasm/loadWasm'

const UPDATE_INTERVAL = 50
const REQUIRE_WASM = import.meta.env.VITE_WASM_ONLY === 'true'

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

export function useRobotSimulation(
  initialRobots: Robot[],
  products: Product[]
) {
  const [robots, setRobots] = useState<Robot[]>(initialRobots)
  const [wasmModule, setWasmModule] =
    useState<Awaited<ReturnType<typeof loadWasm>> | null>(null)

  useEffect(() => {
    loadWasm()
      .then(setWasmModule)
      .catch((error: Error) => {
        console.error('Failed to load WASM module', error)
      })
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRobots((currentRobots) => {
        if (REQUIRE_WASM && !wasmModule?.updateRobots) {
          throw new Error(
            'WASM updateRobots is required (set VITE_WASM_ONLY=false to allow JS fallback). Rebuild wasm with `cd wasm && wasm-pack build --target web --out-dir ../src/wasm/pkg`.'
          )
        }

        if (wasmModule?.updateRobots) {
          const robotBuffer = flattenRobots(currentRobots)
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
            return inflateRobots(currentRobots, result)
          }
        }

        return currentRobots
      })
    }, UPDATE_INTERVAL)

    return () => clearInterval(intervalId)
  }, [products, wasmModule])

  return robots
}
