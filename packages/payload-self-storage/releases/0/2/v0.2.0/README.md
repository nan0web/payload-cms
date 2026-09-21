# payload-self-storage v0.2.0 — Release Specification & Verification Guide

> **Language Selector / Перемикач мов:**  
> [🇺🇸 English (Default)](#) | [🇺🇦 Українська (Документація)](../../../../docs/uk/README.md)

This document details the architecture, typing model, Payload CMS 3.x integration contracts, and a step-by-step verification guide (automated and manual) for release v0.2.0.

---

## 1. Payload CMS Core Architecture & Typing

### Sources of Truth in Payload CMS Core (`payload/dist/`):

- **Endpoints Routing (`config.endpoints`)**:
  - Interface `Endpoint`: [`payload/dist/config/types.d.ts:L258`](../../../../testing-app/node_modules/payload/dist/config/types.d.ts#L258)
  - Signature: `handler: (req: PayloadRequest) => Promise<Response> | Response`
  - Compliant with standard Web API `Request` / `Response` primitives.
- **Upload Collection Handlers (`collection.upload.handlers`)**:
  - Interface `UploadConfig['handlers']`: [`payload/dist/uploads/types.d.ts:L229`](../../../../testing-app/node_modules/payload/dist/uploads/types.d.ts#L229)
  - Signature: `(req: PayloadRequest, args: { doc: TypeWithID, params: { filename: string, collection: string, prefix?: string } }) => Promise<Response|void> | Response | void`
- **Upload Options (`collection.upload`)**:
  - `staticDir: string`: Physical target directory on disk (scoped to `rootDir`).
  - `staticURL: string`: Public HTTP URL prefix (e.g., `/media`).
  - `imageSizes: ImageSize[]`: Sharp size configurations (cleared when `lazySizes: true` to avoid blocking synchronous processing).

---

## 2. Plugin Configuration (`payloadSelfStorage`)

```ts
import { payloadSelfStorage } from '@nan0web/payload-self-storage'
import path from 'node:path'

export const withStorage = payloadSelfStorage({
	// Physical target directory on disk (Docker volume, local folder, etc.)
	rootDir: path.resolve(process.cwd(), 'storage'),

	// Public URL prefix (default: '/media')
	publicUrlPrefix: '/media',

	// Plugin routing isolation (default: true)
	// Exposes isolated endpoint via config.endpoints. No manual Next.js route.ts required!
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

	// Collision resolution strategy: 'reject' (error) or 'overwrite' (deduplicate/overwrite)
	collision: 'reject',
})
```

---

## 3. Step-by-Step Verification Guide (Automated & Manual)

### Step 1. Launch Testing Environment

From root workspace directory `apps/3rdparty/payload-cms`:

```bash
# Start dev server with active self-storage & self-manual plugins
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

**Verified Contracts (17 tests):**

1. Storage by `sourcePath` into nested physical paths.
2. Prevention of `-1`, `-2` suffix generation on file collisions.
3. Storage of arbitrary file extensions (`.pdf`, `.svg`, `.zip`, `.mp4`).
4. Fast hash deduplication (SHA-256) and `isDuplicate` flag assertion.
5. Canonical URL formatting in `afterRead` and `payload-folders` resolution.
6. Resolution of `payload-folders` virtual folder IDs via `findByID`.
7. `lazySizes: true` operational mode (clearing synchronous `imageSizes`).
8. Autonomous file serving via isolated endpoint (`/media/:path*`) with custom `mimeTypes` and `cacheControl`.

---

### Step 3. Manual Browser Verification (Payload Admin)

1. Open `http://localhost:3000/admin`.
2. Sign in as administrator (`dev@payloadcms.com` / `test`).
3. Navigate to **Media** collection (`/admin/collections/media`).
4. **`payload-folders` Verification**:
   - Create a virtual folder (e.g. `products/cards`).
   - Upload any image (e.g. `card.png`).
   - Check disk: File is saved under `storage/products/cards/card.webp` (or `storage/<folder>/card.png`).
   - Check Document URL: `/media/products/cards/card.webp`.
5. **Standalone File Serving (Zero Route Handler)**:
   - Open file URL in new browser tab: `http://localhost:3000/media/products/cards/card.webp`.
   - File opens with `200 OK` status.
   - Headers present: `Content-Type: image/webp` and `Cache-Control: public, max-age=31536000, immutable`.
6. **`sourcePath` Field Verification**:
   - Create new Media document, set `sourcePath` to `docs/manual.pdf`, and upload PDF file.
   - Verify file is served at `http://localhost:3000/media/docs/manual.pdf`.
7. **Deduplication Verification**:
   - Upload duplicate file under different name or to same path.
   - Admin UI sidebar marks **Is Duplicate: true** and populates **Duplicate Message** with reference link without creating duplicate files on disk.

---

### Step 4. Code & Type Verification

```bash
cd packages/payload-self-storage
pnpm knip     # Unused dependencies and exports check
pnpm build    # TypeScript declarations build (tsc) in types/
```
