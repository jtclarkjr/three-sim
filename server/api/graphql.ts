import { defineEventHandler, getRequestURL, readBody } from 'h3'
import { yoga } from '@/server/graphql'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const method = event.node?.req?.method ?? 'GET'

  let body: BodyInit | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    const rawBody = await readBody(event)
    body = JSON.stringify(rawBody)
  }

  const request = new Request(url, {
    method,
    headers: (event.node?.req?.headers ?? {}) as HeadersInit,
    body
  })

  return yoga.fetch(request)
})
