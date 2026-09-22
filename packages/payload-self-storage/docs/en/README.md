# @nan0web/payload-self-storage

Self-hosted filesystem storage adapter, fast hash deduplication, multi-extension support, and backup foundation for Payload CMS 3.x.

## Features v0.2.0

- **Physical Subfolders via `sourcePath`**: Explicitly save uploaded files to nested physical directory structures (e.g. `img/products/cards/Visa-Instant.webp`).
- **Payload Folders Hierarchy**: Automatically maps Payload Admin virtual folders (`payload-folders`) to real physical directories on disk (`storage/<folder_path>/<filename>.<ext>`), resolving IDs via `findByID`.
- **Arbitrary File Types & Extensions**: Seamless handling of `.pdf`, `.svg`, `.zip`, `.mp4`, etc., retaining original extensions and MIME types.
- **Fast-Path Deduplication (Size + SHA-256 Checksum)**:
  - Detects duplicate file uploads instantly without generating confusing `-1`, `-2` suffixes.
  - Cleans up redundant files on disk and references existing canonical files.
  - Adds `isDuplicate` boolean flag and user-friendly `duplicateMessage` field to the document.
- **Canonical URLs**: Formats clean, direct URLs matching the physical path for optimal RSC and SSG delivery.
- **Isolated Routing (`isolateRouting: true`)**: Zero Next.js route adapters needed. Plugin automatically exposes `/media/:path*` via Payload `config.endpoints`.
- **Lazy Sizes (`lazySizes: true`)**: Disables synchronous Sharp thumbnail generation on upload, rendering resized thumbnails strictly on-demand on first GET.
- **Parameterized File Server**: Configurable `mimeTypes`, `cacheControl`, and `thumbnailFormats` with an extensive default registry of modern media types.

## Setup

### 1. Configure Plugin in `payload.config.ts`

```ts
import { buildConfig } from 'payload'
import { payloadSelfStorage } from '@nan0web/payload-self-storage'
import path from 'node:path'

export default payloadSelfStorage({
  rootDir: path.resolve(process.cwd(), 'storage'),
  publicUrlPrefix: '/media',
  collections: ['media'],
  lazySizes: true,
})(buildConfig({
  // Payload config
}))
```

### 2. Next.js App Router Route Handler

In Payload 3.x (Next.js App Router), plugin `endpoints` are mounted under `/api/...`.
If you want clean, direct URLs (such as `/media/*`), create a single-line catch-all route handler in your Next.js application:

**`src/app/(frontend)/media/[...path]/route.ts`** (or `src/app/media/[...path]/route.ts`):
```ts
import { createMediaRouteHandler } from '@nan0web/payload-self-storage'
import path from 'node:path'

export const GET = createMediaRouteHandler({
  rootDir: path.resolve(process.cwd(), 'storage'),
  publicUrlPrefix: '/media',
})
```

> **Automatic Diagnostic & Warning:**
> If `publicUrlPrefix` does not start with `/api` and no matching `route.ts` is detected, the plugin automatically logs a warning in the server console on Payload initialization and sets `admin.custom.selfStorage.routeWarning`.

### 3. Static Site Generation (SSG)

Before running static export, synchronize all files and thumbnails to the distribution directory:
```ts
import { syncStorageToDist } from '@nan0web/payload-self-storage'

await syncStorageToDist({
  rootDir: './storage',
  targetDir: './public/media', // or './out/media'
})
```

## Developer & Agent References

- [v0.2.0 Release Task Specification](../../releases/0/2/v0.2.0/task.md)
- [v0.2.0 Acceptance Tests](../../releases/0/2/v0.2.0/task.spec.js)
- [User Guide & Storage Manual (Media)](./payload/collections/media.md)
