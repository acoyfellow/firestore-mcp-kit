import { defineNotesTools, type NotesContext } from './index.js'
import { createFirebaseAdminFirestore } from './firestore-admin.js'
import { startHttpServer } from '../../../src/index.js'

const port = Number(process.env.PORT ?? '8000')
const { firestore } = await createFirebaseAdminFirestore()
const tools = defineNotesTools({
  firestore,
  path: (id) => `notes/${id}`,
})

const app = await startHttpServer<NotesContext>({
  name: 'notes-example-firestore',
  version: '0.1.0',
  port,
  tools,
  getContext: async () => ({
    actorId: 'local-user',
    canDelete: true,
  }),
})

console.log(
  `notes Firestore HTTP server listening on http://localhost:${port}${app.endpoint}`
)
