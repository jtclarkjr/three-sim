import { createServerFn } from '@tanstack/react-start'

async function executeGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  // Lazy load to avoid Vite trying to bundle bun:sqlite
  const { graphql } = await import('graphql')
  const { readFileSync } = await import('node:fs')
  const { join } = await import('node:path')
  const { makeExecutableSchema } = await import('@graphql-tools/schema')
  const { resolvers } = await import('@/graphql/resolvers')

  const typeDefs = readFileSync(
    join(process.cwd(), 'src/graphql/schema.graphql'),
    'utf-8'
  )

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  })

  const result = await graphql({
    schema,
    source: query,
    variableValues: variables
  })

  if (result.errors) {
    throw new Error(result.errors[0]?.message ?? 'GraphQL error')
  }

  if (!result.data) {
    throw new Error('No data returned from GraphQL')
  }

  return result.data as T
}

type SimulationConfigResponse = {
  productCount: number
  robotCount: number
  trackedRobotId: string | null
  pickupProductId: string | null
  dropRow: number | null
  dropProgress: number | null
  rowCount: number | null
  rowSpacing: number | null
  rowThickness: number | null
  startOffset: number | null
  walkwayWidth: number | null
  crossRowBuffer: number | null
  outerWalkwayOffset: number | null
  storeWidth: number | null
  storeHeight: number | null
  orientation: string | null
  updatedAt: string
} | null

export const getSimulationConfig: () => Promise<SimulationConfigResponse> =
  createServerFn({ method: 'GET' }).handler(
    async (): Promise<SimulationConfigResponse> => {
      const data = await executeGraphQL<{
        simulationConfig: SimulationConfigResponse
      }>(
        `query {
          simulationConfig {
            productCount
            robotCount
            trackedRobotId
            pickupProductId
            dropRow
            dropProgress
            rowCount
            rowSpacing
            rowThickness
            startOffset
            walkwayWidth
            crossRowBuffer
            outerWalkwayOffset
            storeWidth
            storeHeight
            orientation
            updatedAt
          }
        }`
      )

      return data.simulationConfig
    }
  )

type ProductResponse = Array<{ id: string; x: number; y: number }>

export const getProducts: () => Promise<ProductResponse> = createServerFn({
  method: 'GET'
}).handler(async (): Promise<ProductResponse> => {
  const data = await executeGraphQL<{
    products: ProductResponse
  }>(
    `query {
          products {
            id
            x
            y
          }
        }`
  )

  return data.products
})

type SaveSimulationInput = {
  productCount: number
  robotCount: number
  trackedRobotId?: string | null
  pickupProductId?: string | null
  dropRow?: number | null
  dropProgress?: number | null
  rowCount?: number | null
  rowSpacing?: number | null
  rowThickness?: number | null
  startOffset?: number | null
  walkwayWidth?: number | null
  crossRowBuffer?: number | null
  outerWalkwayOffset?: number | null
  storeWidth?: number | null
  storeHeight?: number | null
  orientation?: string | null
  products: Array<{ id: string; x: number; y: number }>
}

type SaveSimulationResponse = {
  success: boolean
  message: string | null
}

const saveSimulationServerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: SaveSimulationInput) => data)
  .handler(async ({ data }): Promise<SaveSimulationResponse> => {
    const result = await executeGraphQL<{
      saveSimulation: SaveSimulationResponse
    }>(
      `mutation SaveSimulation($input: SaveSimulationInput!) {
        saveSimulation(input: $input) {
          success
          message
        }
      }`,
      { input: data }
    )

    return result.saveSimulation
  })

export const saveSimulation = async (
  input: SaveSimulationInput
): Promise<SaveSimulationResponse> => saveSimulationServerFn({ data: input })

type ResetSimulationResponse = {
  success: boolean
  message: string | null
}

export const resetSimulation: () => Promise<ResetSimulationResponse> =
  createServerFn({ method: 'POST' }).handler(
    async (): Promise<ResetSimulationResponse> => {
      const result = await executeGraphQL<{
        resetSimulation: ResetSimulationResponse
      }>(
        `mutation {
          resetSimulation {
            success
            message
          }
        }`
      )

      return result.resetSimulation
    }
  )
