# payload-self-storage v0.3.0 — Release Specification & Verification Guide

> **Language Selector / Перемикач мов:**  
> [🇺🇸 English (Default)](#) | [🇺🇦 Українська (Документація)](../../../../docs/uk/README.md)

This document details the architecture, typing model, Payload CMS 3.x integration contracts, and a step-by-step verification guide (automated and manual) for release v0.3.0.

---

## 1. Release Goals & Architecture

Release v0.3.0 completely resolves the "flat URL" defect for image sizes and thumbnails in Payload CMS. It enforces deterministic O(1) file access without recursive filesystem scans, maintains hierarchical paths (`folderPath`) in all `doc.sizes` entries (`filename` and `url`), introduces a dedicated `.thumbnails` cache directory isolated from backups, supports root-relative URL prefixes (`publicUrlPrefix: ''`), and enforces **Zero-App-Boilerplate** autonomy.

### Key Enhancements:

1. **Zero-App-Boilerplate (No Custom Route Handlers)**:
   - Eliminates the need for developers to manually add Next.js App Router handlers (`app/(frontend)/media/[...path]/route.ts`).
   - The plugin automatically mounts the hierarchical streaming handler directly onto Payload's `collection.endpoints` (`/file/:path*`).

2. **Dual-Mode Architecture (SSG vs SSR)**:
   - **SSR / Dynamic Dev / Admin**: On-demand Sharp image resizing cached in `.thumbnails` and streamed on the fly.
   - **SSG (Static Site Generation / Export)**: `syncStorageToDist({ rootDir, targetDir, thumbnailsDir })` copies the whole hierarchical media tree into the static publication distribution directory (`out/` or `dist/`) without requiring an active Node.js / API server.

3. **Hierarchical Paths in `doc.sizes`**:
   - `doc.sizes[key].filename`: Contains the full folder path (e.g., `screenshots/recent/image-300x82.webp`).
   - `doc.sizes[key].url`: Resolves with the public URL prefix and folder path (`/media/screenshots/recent/image-300x82.webp` or `/screenshots/recent/...`).
   - Dynamically ensured during both `beforeChange` and `afterRead`.

4. **O(1) Direct File Serving (Zero Recursive Search)**:
   - File retrieval in upload handlers directly resolves the target disk path using `sizeDoc.filename`, `sizeDoc.url`, or parameter matching.
   - Eliminates redundant recursive disk traversals (`findRecursive`), providing high-throughput, non-blocking I/O.

5. **Dedicated Thumbnail Cache (`thumbnailsDir`)**:
   - Dynamically generated thumbnails and sizes are cached in a dedicated `.thumbnails` directory.
   - Isolated from backup exports (`exportFiles` and `backend.list()`).

6. **Empty Public URL Prefix Support (Root Paths)**:
   - `createPathPolicy({ publicUrlPrefix: '' })` allows serving files directly from the root path (`/img/logo.webp` or `/screenshots/...`) without mandatory prefixes (ideal for banking & corporate portals like IndustrialBank).

---

## 2. Plugin Configuration (`payloadSelfStorage`)

```ts
import { payloadSelfStorage, syncStorageToDist, syncThumbnailsToStatic } from '@nan0web/payload-self-storage'

import path from 'node:path'

export const withStorage = payloadSelfStorage({
	// Physical storage directory on disk
	rootDir: path.resolve(process.cwd(), 'storage'),

	// Dedicated thumbnails cache directory (isolated from backups)
	thumbnailsDir: path.resolve(process.cwd(), 'storage/.thumbnails'),

	// Public URL prefix (default: '/media', supports '' for root-relative)
	publicUrlPrefix: '/media',

	// Plugin routing isolation (default: true)
	isolateRouting: true,

	// On-demand Sharp thumbnail generation (default: false)
	lazySizes: true,

	// Custom MIME types registry
	mimeTypes: {
		'.custom': 'application/x-custom-package',
		'.avif': 'image/avif',
	},

	// Supported formats for on-demand Sharp thumbnail rendering
	thumbnailFormats: ['webp', 'png', 'jpg', 'jpeg', 'avif'],

	// Custom Cache-Control header
	cacheControl: 'public, max-age=31536000, immutable',

	// Collision resolution strategy: 'reject' or 'overwrite'
	collision: 'reject',
})
```

---

## 3. Step-by-Step Verification Guide (Automated & Manual)

### Step 1. Launch Testing Environment

From root workspace directory `apps/3rdparty/payload-cms`:

```bash
PLUGINS=self-storage,self-manual pnpm --filter testing-app dev
```

Server starts at `http://localhost:3000`.

---

### Step 2. Automated Contract Verification (TDD)

In terminal, execute package test suite:

```bash
cd packages/payload-self-storage
pnpm test
```

**Verified Contracts (24 tests):**

1. Support for empty `publicUrlPrefix: ''` for root-relative paths.
2. Generation, caching, and reuse of thumbnails in dedicated `thumbnailsDir`.
3. Exclusion of `thumbnailsDir` and hidden directories from backup `exportFiles`.
4. Static build thumbnail synchronization via `syncThumbnailsToStatic`.
5. Full `folderPath` retention in `filename` and `url` for all sizes during `beforeChange`.
6. Dynamic `folderPath` prefixing in `afterRead` for legacy or un-prefixed records.
7. Nested physical storage with `sourcePath`.
8. Collision prevention and duplicate detection.
9. Standalone file serving and isolated endpoints with custom MIME types and cache headers.

---

### Step 3. Full Package Audit & Quality Gate

```bash
cd packages/payload-self-storage
pnpm run test:all
```

Ensures:
- Tests: 100% pass (24/24)
- TypeScript build (`tsc`): Clean compilation
- Knip: Zero unused dependencies or broken exports
- Security audit: Clean dependency audit

---

### Step 4. Manual Browser Verification (Payload Admin)

1. Open `http://localhost:3000/admin`.
2. Sign in as administrator (`dev@payloadcms.com` / `test`).
3. Navigate to **Media** collection (`/admin/collections/media`).
4. Upload an image into a folder (e.g. `screenshots/recent`).
5. Verify in Admin UI:
   - Thumbnail preview displays immediately without 404.
   - Image size URLs contain the full folder path (e.g. `/media/screenshots/recent/image-300x82.webp`).
   - File system on disk contains the cached thumbnail under `.thumbnails/` or the target folder.
