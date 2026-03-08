# firestore-mcp-kit

Build secure, typed MCP tools backed by Firestore.

This repository starts as a product definition and implementation plan. The goal is to keep the first version small, sharp, and usable: a minimal TypeScript library plus a minimal runnable example.

## Overview

`firestore-mcp-kit` is a transport-agnostic TypeScript toolkit for exposing narrowly-defined MCP tools that use Firestore as storage.

The core idea is simple:

- Firestore is the persistence layer, not the public API
- MCP tools should be explicit and typed
- schemas, resource shapes, and permissions live in userland
- dangerous writes should require deliberate opt-in
- the library should stay small and easy to extend

This project is intentionally **not** a generic Firestore explorer, query console, or arbitrary document editor.

## Goals

### Product goals

- Help developers build MCP tools over Firestore quickly
- Make secure defaults easier than unsafe ones
- Keep resource schemas and tool definitions in app code
- Support both stdio and HTTP transports in v1
- Provide a minimal example that proves the approach end-to-end

### Non-goals for v1

- Arbitrary Firestore path access
- Arbitrary query builders as a first-class public API
- Full app frameworks or heavy code generation
- Built-in domain models for pages, CMS, notes, etc.
- Solving rich text or HTML safety at the library layer
- Integration test infrastructure beyond unit tests in the first pass

## Audience

The first user is an external developer who wants to expose safe MCP tools backed by Firestore without building all validation, policy, and tool wiring from scratch.

## Positioning

This is a **library plus minimal runnable example**.

The library should provide the reusable core. The example should demonstrate the intended usage pattern with a tiny generic Firestore-backed resource.

## Design decisions locked in

- **Library shape:** minimal TypeScript library + minimal runnable example
- **Public promise:** build secure, typed MCP tools backed by Firestore
- **Transport support:** HTTP and stdio in v1
- **API style:** support both operation-specific tools and constrained resource CRUD patterns
- **Schema ownership:** userland defines resource shapes, schemas, and allowed edits
- **Validation engine:** Zod in v1
- **Firestore helper scope:** minimal document-centric core; list/query remains userland for now
- **Example app:** tiny generic notes example
- **Testing bar for first pass:** unit tests only

## Principles

### 1. Firestore is storage, not the contract

Consumers of MCP tools should interact with explicit tool inputs and outputs, not raw Firestore documents or arbitrary collection paths.

### 2. Userland owns schema and policy

The library should not assume a domain model. Application code defines:

- resource schemas
- allowed fields
- write policies
- auth context
- dangerous-field rules

### 3. Small surface area wins

The first release should solve a narrow problem well:

- typed tool definition
- schema validation with Zod
- Firestore document reads/writes
- constrained updates
- transport adapters

### 4. Unsafe capability should feel explicit

If a developer wants to expose broad update power, they should have to opt into it deliberately in app code.

### 5. Transport should not leak into domain logic

Core resource/tool logic should be transport-agnostic so the same definitions can be served over stdio or HTTP.

## Proposed v1 scope

### In scope

- A small core package for defining typed MCP tools
- Zod-based input and output validation
- A Firestore wrapper for document-centric operations
- Constrained update helpers based on declared allowlists or explicit patch schemas
- Auth/context hooks for policy checks
- Error types with consistent mapping
- HTTP adapter
- stdio adapter
- Minimal example app using a simple notes resource
- Typecheck, lint, format, and unit test setup

### Out of scope for v1

- Arbitrary query builder exposed as a core abstraction
- Collection-group query support as part of the public surface
- Realtime listeners
- Firestore security-rule generation
- Rich admin UI
- Emulator-backed integration tests
- Multi-database/provider abstraction beyond Firestore

## Proposed package structure

This may evolve, but the initial layout should stay simple.

```text
firestore-mcp-kit/
  README.md
  package.json
  tsconfig.base.json
  eslint.config.js
  packages/
    core/
    http/
    stdio/
  examples/
    notes/
```

### `packages/core`

Responsibilities:

- tool definition primitives
- Zod schema wiring
- auth/context types
- policy hook interfaces
- Firestore document helpers
- constrained patch/update helpers
- shared error types

### `packages/http`

Responsibilities:

- expose core tools over HTTP
- translate transport requests/responses
- keep implementation thin

### `packages/stdio`

Responsibilities:

- expose core tools over stdio
- keep implementation thin

### `examples/notes`

Responsibilities:

- show a tiny resource schema defined in userland
- demonstrate create/get/update/delete patterns
- demonstrate safe constrained updates
- prove both transports can be wired from the same core definitions

## Core API plan

The API should stay small. Names are illustrative, not final.

### 1. Define app context

Application code provides the context shape used by auth/policy logic.

Possible direction:

```ts
type AppContext = {
  actorId: string
  role: 'admin' | 'editor' | 'viewer'
}
```

### 2. Define a userland resource schema

Example for the notes app:

```ts
const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
```

### 3. Define tool inputs/outputs explicitly

Example direction:

```ts
const CreateNoteInput = z.object({
  title: z.string().min(1),
  body: z.string().default(''),
})
```

### 4. Wrap Firestore document access

The library should help with document-centric operations such as:

- get a document by declared path
- create a document from validated input
- update only declared fields
- delete a document

The library should not encourage arbitrary raw writes as the main path.

### 5. Attach policy checks

Policy hooks should be simple functions invoked before reads/writes.

Example direction:

```ts
canCreate(ctx, input) => boolean | Promise<boolean>
canRead(ctx, resource) => boolean | Promise<boolean>
canUpdate(ctx, current, patch) => boolean | Promise<boolean>
```

### 6. Register tools once, serve through multiple transports

The same core definitions should be bindable to:

- stdio MCP server
- HTTP MCP server

## Recommended v1 developer experience

A developer should be able to do roughly this:

1. Define Zod schemas for a resource and tool inputs
2. Define a Firestore path strategy in app code
3. Define tool handlers using the core wrapper helpers
4. Add policy checks in app code
5. Expose the tools over stdio and/or HTTP

## Security model for v1

The project should make these patterns easy:

- validate all inputs with Zod
- validate outputs before returning them
- constrain writable fields explicitly
- centralize auth context
- separate public resource model from raw Firestore document shape when needed
- require deliberate opt-in for dangerous broad updates

The project should avoid implying these guarantees:

- automatic protection for arbitrary raw Firestore writes
- automatic sanitization of app-specific content
- complete authorization without app-defined policy

## Notes example definition

The example should stay intentionally boring.

### Example resource

A note with fields like:

- `id`
- `title`
- `body`
- `createdAt`
- `updatedAt`

### Example tools

The example should demonstrate both supported tool styles:

#### Operation-specific tools

- `notes.create`
- `notes.get`
- `notes.delete`

#### Constrained CRUD-style tool

- `notes.update`
  - only allows a narrow patch such as `title` and `body`
  - patch schema defined in userland

This keeps the example generic while still demonstrating the core value proposition.

## Diátaxis plan for repository documentation

The README should serve as the initial product definition, but the implementation should grow toward four documentation modes.

### Tutorial

- Build a minimal Firestore-backed MCP note tool from scratch

### How-to guides

- Add a new resource
- Add policy checks
- Expose the same tools over stdio and HTTP
- Restrict writable fields safely

### Reference

- Core APIs
- context types
- helper signatures
- transport adapters
- error model

### Explanation

- Why not expose raw Firestore directly?
- Why userland-defined schemas?
- Why explicit constrained updates?
- Why keep transport separate from tool logic?

## Implementation plan

## Phase 0: bootstrap

- create repository
- initialize TypeScript workspace
- configure package manager tooling
- configure ESLint, Prettier, and tsconfig
- configure test runner
- make CI-friendly scripts for lint, typecheck, and test

### Deliverable

A clean workspace with green lint/typecheck/test commands.

## Phase 1: core package skeleton

Build the minimal core abstractions:

- tool definition types
- context types
- Zod schema plumbing
- error types
- Firestore wrapper interface and initial implementation hooks
- constrained update helper shape

### Deliverable

A small core API with unit tests for validation and update constraints.

## Phase 2: transport adapters

Build thin transport packages:

- stdio adapter
- HTTP adapter

These should depend on `core` and avoid duplicating domain logic.

### Deliverable

A shared tool definition can be mounted in both transports.

## Phase 3: notes example

Build the tiny runnable example:

- define note schemas in userland
- define note tools
- connect to Firestore
- wire stdio and HTTP servers

### Deliverable

A minimal example that demonstrates the intended shape of the library.

## Phase 4: polish

- tighten API names
- improve README examples
- add reference docs if needed
- reduce unnecessary abstraction
- ensure all core paths are unit tested

### Deliverable

A small, understandable first release candidate.

## Open questions to resolve during implementation

These do not block starting the repo, but should be settled as code takes shape.

- Exact package manager choice
- Exact MCP SDK dependency shape
- Final naming of the core builder APIs
- Whether Firestore helper code lives entirely in `core` or behind a small integration submodule
- Exact HTTP adapter API shape
- How much output validation should be mandatory vs optional in v1

## Definition of done for first pass

The first pass is done when:

- repository is initialized
- README reflects the agreed product shape
- workspace builds cleanly
- lint passes
- typecheck passes
- unit tests pass
- a developer can run the notes example over stdio and HTTP

## Initial file plan

```text
README.md
package.json
tsconfig.base.json
eslint.config.js
packages/core/src/
packages/http/src/
packages/stdio/src/
examples/notes/src/
```

## Summary

`firestore-mcp-kit` should start as a small, opinionated wrapper around Firestore for building typed MCP tools safely.

It should be:

- generic
- transport-agnostic
- Zod-based
- userland-schema-driven
- minimal
- tested at the unit level

And it should avoid becoming a generic Firestore admin surface disguised as an MCP library.
