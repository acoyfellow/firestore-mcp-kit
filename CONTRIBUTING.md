# Contributing

Thanks for your interest in `firestore-mcp-kit`.

## Local development

Install dependencies:

```bash
npm install
```

Run the usual checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run format:check
```

## Project shape

This repo is intentionally small:

- library code lives in `src/`
- tests live in `test/`
- the example app lives in `examples/notes/src/`

## Changes

Please keep changes narrow and example-driven.

A good change usually does at least one of these:

- improves the core typed tool API
- keeps Firestore writes explicit and constrained
- keeps transports thin
- is justified by the example app

If you want to propose a larger API or architecture change, open an issue first so we can discuss scope.

## Style

- prefer explicit contracts over magic
- prefer small, composable helpers
- avoid broad abstractions unless the example forces them
- keep docs aligned with the actual example flow
