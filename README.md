# firestore-mcp-kit

Build secure, typed MCP tools backed by Firestore.

A minimal TypeScript library for:

- defining explicit MCP-style tools in userland
- validating inputs and outputs with Zod
- wrapping document-centric Firestore operations
- constraining updates with explicit patch schemas

This repo is intentionally small. Firestore is storage, not the public contract.

## Tutorial

Start with the notes example in `examples/notes/src/index.ts`.

It shows how to:

1. define a note schema in userland
2. define explicit tools like `notes.create` and `notes.update`
3. validate inputs and outputs
4. restrict updates to specific fields

## How-to guides

### Add a resource

- define a Zod schema for the resource
- define input/output schemas per tool
- create a `FirestoreResource` with a path function
- implement tools with `defineTool(...)`

### Restrict writable fields

- use `createPatchSchema([...])`
- use `pickPatchedFields(...)`
- only persist allowed keys

## Reference

### Core exports

- `defineTool(...)`
- `executeTool(...)`
- `createPatchSchema(...)`
- `pickPatchedFields(...)`
- `getDocument(...)`
- `setDocument(...)`
- `updateDocument(...)`
- `deleteDocument(...)`
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

### Why this stays small

This library does not expose arbitrary Firestore browsing, arbitrary collection access, or unrestricted patching.

### Why schemas live in userland

Applications own their resource shapes, policy checks, and dangerous-field decisions.

### Why explicit tools

MCP tools should expose narrow, typed operations rather than raw database access.
