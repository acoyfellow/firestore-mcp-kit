import type {
  FirestoreClient,
  FirestoreDocumentRef,
  FirestoreDocumentSnapshot,
} from '../../../src/index.js'

export function createMemoryFirestore() {
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

  return { firestore, store }
}
