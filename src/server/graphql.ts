import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { createYoga } from 'graphql-yoga'
import { resolvers } from '@/graphql/resolvers'

const typeDefs = readFileSync(
  join(process.cwd(), 'src/graphql/schema.graphql'),
  'utf-8'
)

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

export const yoga = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  landingPage: process.env.NODE_ENV === 'development',
  cors: {
    origin: process.env.NODE_ENV === 'development' ? '*' : undefined,
    credentials: true
  }
})
