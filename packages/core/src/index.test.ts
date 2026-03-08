import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  AuthorizationError,
  ValidationError,
  createPatchSchema,
  defineTool,
  executeTool,
  getDocument,
  pickPatchedFields,
  setDocument,
  updateDocument,
} from './index.js'
import type {
  FirestoreClient,
  FirestoreDocumentRef,
  FirestoreDocumentSnapshot,
  FirestoreResource,
} from './index.js'

describe('defineTool / executeTool', () => {
  it('validates input, runs the handler, and validates output', async () => {
    const tool = defineTool({
      name: 'notes.create',
      inputSchema: z.object({ title: z.string().min(1) }),
      outputSchema: z.object({ ok: z.literal(true), title: z.string() }),
      execute: async ({ input }) => ({ ok: true as const, title: input.title }),
    })

    await expect(
      executeTool(tool, { context: {}, input: { title: 'Hello' } })
    ).resolves.toEqual({
      ok: true,
      title: 'Hello',
    })
  })

  it('throws a validation error for invalid input', async () => {
    const tool = defineTool({
      name: 'notes.create',
      inputSchema: z.object({ title: z.string().min(1) }),
      outputSchema: z.object({ ok: z.literal(true) }),
      execute: async () => ({ ok: true as const }),
    })

    await expect(
      executeTool(tool, { context: {}, input: { title: '' } })
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('throws an authorization error when authorize returns false', async () => {
    const tool = defineTool({
      name: 'notes.delete',
      inputSchema: z.object({ id: z.string() }),
      outputSchema: z.object({ ok: z.literal(true) }),
      authorize: ({
        context,
      }: {
        context: { canDelete: boolean }
        input: { id: string }
      }) => context.canDelete,
      execute: async () => ({ ok: true as const }),
    })

    await expect(
      executeTool(tool, {
        context: { canDelete: false },
        input: { id: 'note-1' },
      })
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})

describe('patch helpers', () => {
  it('creates a strict patch schema for allowed keys', () => {
    const patchSchema = createPatchSchema(['title', 'body'])

    expect(patchSchema.parse({ title: 'Updated' })).toEqual({
      title: 'Updated',
    })
    expect(() => patchSchema.parse({ nope: true })).toThrow()
  })

  it('picks only patched allowed fields', () => {
    const result = pickPatchedFields({ title: 'Updated', body: 'Body' }, [
      'title',
    ])

    expect(result).toEqual({ title: 'Updated' })
  })
})

describe('firestore helpers', () => {
  it('wraps document-centric operations', async () => {
    const store = new Map<string, Record<string, unknown>>()

    const firestore: FirestoreClient = {
      doc<TDocument>(path: string): FirestoreDocumentRef<TDocument> {
        return {
          path,
          async get(): Promise<FirestoreDocumentSnapshot<TDocument>> {
            return {
              id: path.split('/').at(-1) ?? '',
              exists: store.has(path),
              data: () => store.get(path) as TDocument | undefined,
            }
          },
          async set(data: TDocument) {
            store.set(path, data as Record<string, unknown>)
          },
          async update(data: Partial<TDocument>) {
            const current = (store.get(path) ?? {}) as Record<string, unknown>
            store.set(path, {
              ...current,
              ...(data as Record<string, unknown>),
            })
          },
          async delete() {
            store.delete(path)
          },
        }
      },
    }

    const resource: FirestoreResource = {
      firestore,
      path: (id) => `notes/${id}`,
    }

    await setDocument(resource, 'note-1', { title: 'First', body: 'Hello' })
    await updateDocument(resource, 'note-1', { title: 'Updated' })

    await expect(getDocument(resource, 'note-1')).resolves.toEqual({
      title: 'Updated',
      body: 'Hello',
    })
  })
})
