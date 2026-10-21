# @nan0web/payload-release

Payload CMS 3.x plugin for release tracking, idempotency, execution logs, and Markdown specification preview.

## Features

- **Releases Collection**: Automatic recording of release runs with tabbed navigation:
  - **General**: Status, version, command (`seed`, `fresh`, `migrate`), execution duration, Git SHA, Git Dirty state, Node.js and pnpm versions.
  - **Steps (N)**: Execution steps with duration and output.
  - **Parity (N)**: Data parity check between CSV/source rows and DB records.
  - **Issues (N)**: Structured audit messages (`info`, `warning`, `error`).
  - **Files (N)**: Release artifacts with size, SHA-256 hash, and embedded modal preview.
- **Embedded Markdown Modal**: Built-in preview for `task.md` and `user.md` directly in the Payload Admin panel.
- **DB-FS Secure Endpoints**: Read release artifacts without blocking Node.js procedural calls in client components.

## Installation

```bash
pnpm add @nan0web/payload-release
```

## Usage

```typescript
import { buildConfig } from 'payload'
import { payloadRelease } from '@nan0web/payload-release'

export default buildConfig({
  plugins: [
    payloadRelease({
      releasesDir: 'releases',
      allowPreview: true,
    }),
  ],
})
```
