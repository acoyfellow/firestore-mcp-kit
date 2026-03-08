import {
  createNotesResource,
  defineNotesTools,
  type NotesContext,
} from './index.js'
import { createMemoryFirestore } from './memory-firestore.js'
import { startStdioServer } from '../../../src/index.js'

const { firestore } = createMemoryFirestore()
const tools = defineNotesTools(createNotesResource(firestore))

await startStdioServer<NotesContext>({
  name: 'notes-example',
  version: '0.1.0',
  tools,
  getContext: async () => ({
    actorId: 'local-user',
    canDelete: true,
  }),
})
