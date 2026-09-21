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

```js
import { buildConfig } from 'payload'
import { payloadSelfStorage } from '@nan0web/payload-self-storage'

const withStorage = payloadSelfStorage({
  rootDir: './storage',
  publicUrlPrefix: '/media',
  publicOrigin: 'http://localhost:3000',
  collections: ['media'],
  convertImageSizesToWebp: true,
})

export default withStorage(buildConfig({
  // Payload config
}))
```

## Developer & Agent References

- [v0.2.0 Release Task Specification](../../releases/0/2/v0.2.0/task.md)
- [v0.2.0 Acceptance Tests](../../releases/0/2/v0.2.0/task.spec.js)
- [User Guide & Storage Manual (Media)](./payload/collections/media.md)
