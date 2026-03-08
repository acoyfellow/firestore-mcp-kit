import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { createMcpServer, defineTool } from '../src/index.js'

describe('createMcpServer', () => {
  it('creates an MCP server instance for a tool map', () => {
    const server = createMcpServer({
      name: 'test-server',
      version: '0.1.0',
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

    expect(server).toBeDefined()
  })
})
