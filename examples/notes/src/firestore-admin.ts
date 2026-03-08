import { readFile } from 'node:fs/promises'

import {
  cert,
  initializeApp,
  type App,
  type ServiceAccount,
} from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

import type {
  FirestoreClient,
  FirestoreDocumentRef,
  FirestoreDocumentSnapshot,
} from '../../../src/index.js'

type ServiceAccountJson = ServiceAccount & {
  project_id?: string
}

export async function createFirebaseAdminFirestore(options?: {
  credentialsPath?: string
  databaseId?: string
}) {
  const credentialsPath =
    options?.credentialsPath ?? process.env.GOOGLE_APPLICATION_CREDENTIALS

  if (!credentialsPath) {
    throw new Error(
      'Missing credentials path. Set GOOGLE_APPLICATION_CREDENTIALS or pass credentialsPath.'
    )
  }

  const credentials = JSON.parse(
    await readFile(credentialsPath, 'utf8')
  ) as ServiceAccountJson

  const app = getOrCreateApp(credentialsPath, credentials)
  const firestore = options?.databaseId
    ? getFirestore(app, options.databaseId)
    : getFirestore(app)

  const client: FirestoreClient = {
    doc<TDocument>(path: string): FirestoreDocumentRef<TDocument> {
      const ref = firestore.doc(path)

      return {
        path,
        async get(): Promise<FirestoreDocumentSnapshot<TDocument>> {
          const snapshot = await ref.get()

          return {
            id: snapshot.id,
            exists: snapshot.exists,
            data: () => snapshot.data() as TDocument | undefined,
          }
        },
        async set(data: TDocument) {
          await ref.set(data as Record<string, unknown>)
        },
        async update(data: Partial<TDocument>) {
          await ref.update(data as Record<string, unknown>)
        },
        async delete() {
          await ref.delete()
        },
      }
    },
  }

  return {
    firestore: client,
    app,
  }
}

const appsByName = new Map<string, App>()

function getOrCreateApp(name: string, credentials: ServiceAccountJson) {
  const existing = appsByName.get(name)

  if (existing) {
    return existing
  }

  const projectId = credentials.projectId ?? credentials.project_id
  const app = initializeApp(
    {
      credential: cert(credentials),
      ...(projectId ? { projectId } : {}),
    },
    `firestore-mcp-kit:${name}`
  )

  appsByName.set(name, app)
  return app
}
