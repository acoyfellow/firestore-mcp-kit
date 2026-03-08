import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { defineTool, startHttpServer } from '../src/index.js'

const servers: Array<{ close: () => Promise<void> }> = []

afterEach(async () => {
  while (servers.length > 0) {
    await servers.pop()?.close()
  }
})

describe('startHttpServer', () => {
  it('serves a health endpoint', async () => {
    const app = await startHttpServer({
      name: 'test-http',
      version: '0.1.0',
      port: 4101,
      getContext: async () => ({ actorId: 'user-1' }),
      tools: {
        ping: defineTool({
          name: 'ping',
          inputSchema: z.object({ message: z.string() }),
          outputSchema: z.object({ echoed: z.string() }),
          execute: async ({ input }) => ({ echoed: input.message }),
        }),
      },
    })

    servers.push(app)

    const response = await fetch('http://127.0.0.1:4101/health')
    const body = (await response.json()) as { ok: boolean }

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true })
  })
})
