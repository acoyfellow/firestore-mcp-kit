# firestore-mcp-kit

Build secure, typed MCP tools backed by Firestore.

`firestore-mcp-kit` is a minimal TypeScript library for defining explicit MCP tools in userland, validating them with Zod, and wiring them to document-centric Firestore operations.

It stays intentionally small:

- Firestore is storage, not the public contract
- schemas and policies live in app code
- writes should be narrow and explicit
- transports should stay thin

## Tutorial

Build from the example in `examples/notes/src/index.ts`.

The flow is:

1. define a resource schema with Zod
2. define explicit tool input/output schemas
3. create a Firestore resource path function
4. implement tools with `defineTool(...)`
5. run them over stdio or HTTP

### Minimal shape

```ts
const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const notes = defineNotesTools(resource)
```

### Getting started

```ts
import { startHttpServer } from 'firestore-mcp-kit'
import {
  type NotesContext,
  defineNotesTools,
} from './examples/notes/src/index.js'
import { createMemoryFirestore } from './examples/notes/src/memory-firestore.js'

const { firestore } = createMemoryFirestore()
const tools = defineNotesTools({
  firestore,
  path: (id) => `notes/${id}`,
})

await startHttpServer<NotesContext>({
  name: 'notes-example',
  version: '0.1.0',
  port: 8000,
  tools,
  getContext: async () => ({ actorId: 'local-user', canDelete: true }),
})
```

Run the example:

```bash
npm run dev:stdio
npm run dev:http
```

Use a real Firestore project with a local service-account file:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
npm run dev:http:firestore
```

Keep credentials out of git. The repo ignores common credential file names by default.

HTTP default endpoint:

- `http://localhost:8000/mcp`
- health check: `http://localhost:8000/health`

## How-to guides

### Add a resource

1. Define a resource schema in userland.
2. Define explicit input/output schemas per tool.
3. Create a `FirestoreResource`:

```ts
const resource = createFirestoreResource(firestore, (id) => `notes/${id}`)
```

4. Implement tools with `defineTool(...)`.
5. Execute them directly or expose them through a transport.

### Restrict writable fields

Use `createPatchSchema(...)` and `pickPatchedFields(...)`.

```ts
const NotePatchSchema = createPatchSchema(['title', 'body']).extend({
  title: z.string().min(1).optional(),
  body: z.string().optional(),
})
```

This keeps update behavior explicit and avoids broad arbitrary patching.

### Run over stdio

```ts
await startStdioServer({
  name: 'notes-example',
  version: '0.1.0',
  tools,
  getContext: async () => ({ actorId: 'local-user', canDelete: true }),
})
```

### Run over HTTP

```ts
await startHttpServer({
  name: 'notes-example',
  version: '0.1.0',
  port: 8000,
  tools,
  getContext: async () => ({ actorId: 'local-user', canDelete: true }),
})
```

## Reference

### Core tool API

- `defineTool(...)`
- `executeTool(...)`
- `createMcpServer(...)`

### Transport helpers

- `startStdioServer(...)`
- `startHttpServer(...)`

### Firestore helpers

- `getDocument(...)`
- `setDocument(...)`
- `updateDocument(...)`
- `deleteDocument(...)`

### Patch helpers

- `createPatchSchema(...)`
- `pickPatchedFields(...)`

### Errors

- `FirestoreMcpError`
- `AuthorizationError`
- `ValidationError`
- `NotFoundError`

### Firestore interfaces

- `FirestoreClient`
- `FirestoreDocumentRef<TDocument>`
- `FirestoreDocumentSnapshot<TDocument>`
- `FirestoreResource`

## Explanation

### Why not expose raw Firestore directly?

Because MCP tools should expose narrow, typed operations instead of arbitrary database access.

### Why do schemas live in userland?

Because applications own their resource shapes, policy checks, and dangerous-field rules.

### Why are updates constrained?

Because unrestricted patching is too broad for the default path. Safe write behavior should feel deliberate.

### Why keep transports thin?

Because the same tool definitions should work over stdio or HTTP without changing domain logic.

### When should I use this instead of Firebase's MCP server?

Use this library when you want Firestore behind a narrow app contract instead of exposing broader platform capabilities directly. It is a better fit when you want tool names like `notes.create` or `tickets.assign`, app-owned Zod schemas, explicit authorization hooks, and constrained writes. Firebase's MCP server is a better fit when you want a more complete Firebase-integrated server with less userland code and are comfortable with a more platform-shaped surface area.
