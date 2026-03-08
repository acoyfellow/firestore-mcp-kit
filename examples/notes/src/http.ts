import { defineNotesTools, type NotesContext } from './index.js'
import { createMemoryFirestore } from './memory-firestore.js'
import { startHttpServer } from '../../../src/index.js'

const port = Number(process.env.PORT ?? '8000')
const { firestore } = createMemoryFirestore()
const tools = defineNotesTools({
  firestore,
  path: (id) => `notes/${id}`,
})

const app = await startHttpServer<NotesContext>({
  name: 'notes-example',
  version: '0.1.0',
  port,
  tools,
  getContext: async () => ({
    actorId: 'local-user',
    canDelete: true,
  }),
})

console.log(
  `notes HTTP server listening on http://localhost:${port}${app.endpoint}`
)
