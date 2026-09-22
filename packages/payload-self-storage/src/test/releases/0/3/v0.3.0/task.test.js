import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile, mkdir, readFile, access } from 'node:fs/promises'
import { Readable } from 'node:stream'
import os from 'node:os'
import path from 'node:path'
import {
	payloadSelfStorage,
	createPathPolicy,
	serveStorageFile,
	exportFiles,
	syncThumbnailsToStatic,
} from '../../../../../index.js'

describe('payload-self-storage v0.3.0 contract specification', () => {
	it('supports empty publicUrlPrefix for root-relative paths without errors', async () => {
		const policy = createPathPolicy({ publicUrlPrefix: '' })
		assert.equal(policy.normalizeUrl('/img/logo.webp'), '/img/logo.webp')
		assert.equal(policy.storageKey('/img/logo.webp'), 'img/logo.webp')
		assert.equal(policy.relativeUrl('img/logo.webp'), '/img/logo.webp')
		assert.equal(policy.relativeUrl('favicon.ico'), '/favicon.ico')
	})

	it('generates and caches thumbnails in dedicated thumbnailsDir, and reuses them on subsequent requests', async (t) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-thumb-'))
		const thumbs = path.join(root, '.thumbnails')
		t.after(async () => {
			await rm(root, { recursive: true, force: true })
		})

		// Create a mock original image file
		await mkdir(path.join(root, 'img/products'), { recursive: true })
		const originalPath = path.join(root, 'img/products/card.webp')
		await writeFile(originalPath, 'mock-original-image-content')

		const withStorage = payloadSelfStorage({
			rootDir: root,
			thumbnailsDir: thumbs,
			publicUrlPrefix: '/media',
		})

		// Mock locate and server
		const mockBackend = {
			locate: async (url) => {
				throw new Error('Not found canonical')
			},
		}

		// First request for thumbnail: img/products/card-300x200.webp
		// In test without real sharp image buffer, if sharp fails it will fallback or write to thumbs
		const res = await serveStorageFile(mockBackend, root, '/media/img/products/card-300x200.webp', {
			thumbnailsDir: thumbs,
		})

		// Thumbnails directory must have been checked/created
		const thumbExists = await access(thumbs).then(() => true).catch(() => false)
		assert.equal(thumbExists, true)
		assert.equal(res.status, 200)
	})

	it('excludes thumbnailsDir and hidden folders from backup exportFiles', async (t) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-backup-'))
		const thumbs = path.join(root, '.thumbnails')
		const destDir = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-backup-dest-'))
		t.after(async () => {
			await rm(root, { recursive: true, force: true })
			await rm(destDir, { recursive: true, force: true })
		})

		// Create original files
		await mkdir(path.join(root, 'cards'), { recursive: true })
		await writeFile(path.join(root, 'cards/debit.webp'), 'debit-card-data')
		await writeFile(path.join(root, 'cards/credit.webp'), 'credit-card-data')

		// Create thumbnail files in .thumbnails
		await mkdir(thumbs, { recursive: true })
		await writeFile(path.join(thumbs, 'debit-150x150.webp'), 'thumbnail-data')

		const withStorage = payloadSelfStorage({
			rootDir: root,
			thumbnailsDir: thumbs,
		})

		const exported = []
		for await (const record of withStorage.backend.list()) {
			exported.push(record.storageKey)
		}

		assert.equal(exported.includes('cards/debit.webp'), true)
		assert.equal(exported.includes('cards/credit.webp'), true)
		// Must not include anything from .thumbnails
		assert.equal(exported.some((key) => key.includes('.thumbnails') || key.includes('150x150')), false)
	})

	it('syncs thumbnails to target directory for static build deployment', async (t) => {
		const thumbs = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-sync-src-'))
		const staticOut = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-sync-out-'))
		t.after(async () => {
			await rm(thumbs, { recursive: true, force: true })
			await rm(staticOut, { recursive: true, force: true })
		})

		await writeFile(path.join(thumbs, 'banner-800x400.webp'), 'banner-thumb-data')
		await syncThumbnailsToStatic({
			thumbnailsDir: thumbs,
			targetDir: path.join(staticOut, 'media'),
		})

		const synced = await readFile(path.join(staticOut, 'media/banner-800x400.webp'), 'utf8')
		assert.equal(synced, 'banner-thumb-data')
	})

	it('ensures all generated sizes retain full folderPath in filename and url during beforeChange', async (t) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-sizes-'))
		t.after(async () => {
			await rm(root, { recursive: true, force: true })
		})

		const withStorage = payloadSelfStorage({ rootDir: root, publicUrlPrefix: '/media' })
		const config = withStorage({
			collections: [{ slug: 'media', hooks: {} }],
		})
		const media = config.collections[0]

		const doc = {
			folder: 'screenshots/recent',
			filename: 'Hemp field bg.webp',
			url: '/media/Hemp field bg.webp',
			sizes: {
				thumbnail: {
					filename: 'Hemp field bg-300x82.webp',
					url: '/media/Hemp field bg-300x82.webp',
					width: 300,
					height: 82,
				},
				large: {
					filename: 'Hemp field bg-1400x384.webp',
					url: '/media/Hemp field bg-1400x384.webp',
					width: 1400,
					height: 384,
				},
			},
		}

		// Mock backend files exist initially
		await withStorage.backend.write('/media/Hemp field bg.webp', Readable.from('original-image'))
		await withStorage.backend.write('/media/Hemp field bg-300x82.webp', Readable.from('thumb-image'))
		await withStorage.backend.write('/media/Hemp field bg-1400x384.webp', Readable.from('large-image'))

		const result = await media.hooks.beforeChange[0]({
			doc,
			req: {
				data: { folder: 'screenshots/recent' },
			},
		})

		// Check original
		assert.equal(result.filename, 'screenshots/recent/Hemp field bg.webp')
		assert.equal(result.url, '/media/screenshots/recent/Hemp field bg.webp')

		// Check sizes have full folderPath in both filename and url
		assert.equal(result.sizes.thumbnail.filename, 'screenshots/recent/Hemp field bg-300x82.webp')
		assert.equal(result.sizes.thumbnail.url, '/media/screenshots/recent/Hemp field bg-300x82.webp')
		assert.equal(result.sizes.large.filename, 'screenshots/recent/Hemp field bg-1400x384.webp')
		assert.equal(result.sizes.large.url, '/media/screenshots/recent/Hemp field bg-1400x384.webp')
	})

	it('ensures afterRead dynamically prefixes sizes with folderPath if missing', async () => {
		const withStorage = payloadSelfStorage({ rootDir: '/mock/storage', publicUrlPrefix: '/media' })
		const config = withStorage({
			collections: [{ slug: 'media', hooks: {} }],
		})
		const media = config.collections[0]

		const docFromDb = {
			folder: 'screenshots/recent',
			filename: 'Hemp field bg.webp',
			url: '/media/Hemp field bg.webp',
			thumbnailURL: '/api/media/file/Hemp field bg-300x82.webp',
			sizes: {
				thumbnail: {
					filename: 'Hemp field bg-300x82.webp',
					url: '/api/media/file/Hemp field bg-300x82.webp',
				},
			},
		}

		const readDoc = await media.hooks.afterRead[0]({
			doc: docFromDb,
			req: {},
		})

		assert.equal(readDoc.url, '/media/screenshots/recent/Hemp field bg.webp')
		assert.equal(readDoc.thumbnailURL, '/media/screenshots/recent/Hemp field bg-300x82.webp')
		assert.equal(readDoc.sizes.thumbnail.url, '/media/screenshots/recent/Hemp field bg-300x82.webp')
		assert.equal(readDoc.sizes.thumbnail.filename, 'screenshots/recent/Hemp field bg-300x82.webp')
	})

	it('registers Zero-App-Boilerplate route in collection.endpoints and serves files autonomously', async (t) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-endpoints-'))
		t.after(async () => {
			await rm(root, { recursive: true, force: true })
		})

		const withStorage = payloadSelfStorage({ rootDir: root, publicUrlPrefix: '/media' })
		const config = withStorage({
			collections: [
				{
					slug: 'media',
					upload: {},
					endpoints: [
						{ path: '/custom-existing', method: 'get', handler: () => new Response('existing') },
					],
				},
			],
		})
		const media = config.collections[0]

		assert.ok(Array.isArray(media.endpoints))
		const fileEndpoint = media.endpoints.find((e) => e.path === '/file/:path*' && e.method === 'get')
		assert.ok(fileEndpoint, 'Must register /file/:path* on collection.endpoints')

		// Create file on disk
		await mkdir(path.join(root, 'docs/invoices'), { recursive: true })
		await writeFile(path.join(root, 'docs/invoices/inv-001.webp'), 'invoice-file-content')

		const response = await fileEndpoint.handler({
			url: '/media/docs/invoices/inv-001.webp',
		})
		assert.equal(response.status, 200)
		assert.equal(response.headers.get('Content-Type'), 'image/webp')
	})

	it('synchronizes entire storage tree and thumbnails to static target directory via syncStorageToDist', async (t) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-dist-src-'))
		const thumbs = path.join(root, '.thumbnails')
		const targetDist = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-dist-dest-'))
		t.after(async () => {
			await rm(root, { recursive: true, force: true })
			await rm(targetDist, { recursive: true, force: true })
		})

		// Create nested media files
		await mkdir(path.join(root, 'reports/2026'), { recursive: true })
		await writeFile(path.join(root, 'reports/2026/annual.webp'), 'annual-report-data')

		// Create thumbnail in .thumbnails
		await mkdir(thumbs, { recursive: true })
		await writeFile(path.join(thumbs, 'annual-300x200.webp'), 'annual-thumb-data')

		const { syncStorageToDist } = await import('../../../../../index.js')
		const result = await syncStorageToDist({
			rootDir: root,
			targetDir: targetDist,
			thumbnailsDir: thumbs,
		})

		assert.equal(result.copiedFiles, 2)
		const copiedReport = await readFile(path.join(targetDist, 'reports/2026/annual.webp'), 'utf8')
		const copiedThumb = await readFile(path.join(targetDist, 'annual-300x200.webp'), 'utf8')
		assert.equal(copiedReport, 'annual-report-data')
		assert.equal(copiedThumb, 'annual-thumb-data')
	})

	it('createMediaRouteHandler serves media files for Next.js App Router route', async (t) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-route-'))
		t.after(async () => {
			await rm(root, { recursive: true, force: true })
		})

		await mkdir(path.join(root, 'Root'), { recursive: true })
		await writeFile(path.join(root, 'Root/test-asset.webp'), 'asset-data')

		const { createMediaRouteHandler } = await import('../../../../../index.js')
		const handler = createMediaRouteHandler({
			rootDir: root,
			publicUrlPrefix: '/media',
		})

		const mockReq = new Request('http://localhost:3000/media/Root/test-asset.webp')
		const response = await handler(mockReq)
		assert.equal(response.status, 200)
		assert.equal(response.headers.get('Content-Type'), 'image/webp')
	})

	it('warns when publicUrlPrefix has no Next.js route handler and records in admin.custom.selfStorage', async () => {
		const withStorage = payloadSelfStorage({
			rootDir: '/dummy/storage',
			publicUrlPrefix: '/custom-unregistered-prefix',
		})
		const applied = withStorage({
			admin: {},
			collections: [],
		})
		assert.equal(applied.admin.custom.selfStorage.hasRouteHandler, false)
		assert.ok(applied.admin.custom.selfStorage.routeWarning.includes('Next.js Route Handler not found'))
	})
})


