import { z } from 'zod'

import {
  createPatchSchema,
  defineTool,
  deleteDocument,
  getDocument,
  NotFoundError,
  pickPatchedFields,
  setDocument,
  updateDocument,
  createFirestoreResource,
  type FirestoreClient,
  type FirestoreResource,
} from '../../../src/index.js'

export type NotesContext = {
  actorId: string
  canDelete: boolean
}

export const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Note = z.infer<typeof NoteSchema>

export function createNotesResource(
  firestore: FirestoreClient
): FirestoreResource {
  return createFirestoreResource(firestore, (id) => `notes/${id}`)
}

const CreateNoteInput = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().default(''),
})

const GetNoteInput = z.object({
  id: z.string().min(1),
})

const DeleteNoteInput = z.object({
  id: z.string().min(1),
})

const NotePatchSchema = createPatchSchema(['title', 'body']).extend({
  title: z.string().min(1).optional(),
  body: z.string().optional(),
})

const UpdateNoteInput = z.object({
  id: z.string().min(1),
  patch: NotePatchSchema,
})

function now() {
  return new Date().toISOString()
}

export function defineNotesTools(resource: FirestoreResource) {
  return {
    create: defineTool({
      name: 'notes.create',
      description: 'Create a note.',
      inputSchema: CreateNoteInput,
      outputSchema: NoteSchema,
      async execute({ input }) {
        const timestamp = now()
        const note: Note = {
          id: input.id,
          title: input.title,
          body: input.body,
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        await setDocument(resource, input.id, note)
        return note
      },
    }),
    get: defineTool({
      name: 'notes.get',
      description: 'Get a note by id.',
      inputSchema: GetNoteInput,
      outputSchema: NoteSchema,
      async execute({ input }) {
        const note = await getDocument<Note>(resource, input.id)

        if (!note) {
          throw new NotFoundError(`Note ${input.id} was not found`)
        }

        return note
      },
    }),
    update: defineTool({
      name: 'notes.update',
      description: 'Update a note title and/or body.',
      inputSchema: UpdateNoteInput,
      outputSchema: NoteSchema,
      async execute({ input }) {
        const current = await getDocument<Note>(resource, input.id)

        if (!current) {
          throw new NotFoundError(`Note ${input.id} was not found`)
        }

        const changes = pickPatchedFields(input.patch, ['title', 'body'])
        const next: Note = {
          ...current,
          ...changes,
          updatedAt: now(),
        }

        await updateDocument(resource, input.id, {
          ...changes,
          updatedAt: next.updatedAt,
        })

        return next
      },
    }),
    delete: defineTool({
      name: 'notes.delete',
      description: 'Delete a note by id.',
      inputSchema: DeleteNoteInput,
      outputSchema: z.object({ ok: z.literal(true) }),
      authorize: ({
        context,
      }: {
        context: NotesContext
        input: { id: string }
      }) => context.canDelete,
      async execute({ input }) {
        await deleteDocument(resource, input.id)
        return { ok: true as const }
      },
    }),
  }
}
