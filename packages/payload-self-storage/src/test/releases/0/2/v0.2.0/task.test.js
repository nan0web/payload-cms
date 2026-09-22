import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { Readable } from 'node:stream'
import os from 'node:os'
import path from 'node:path'
import { payloadSelfStorage } from '../../../../../index.js'

describe('payload-self-storage v0.2.0 contract specification', () => {
	it('saves files into nested physical paths when sourcePath is provided', async (t) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-sp-'))
		t.after(async () => {
			await rm(root, { recursive: true, force: true })
		})

		const withStorage = payloadSelfStorage({ rootDir: root })
		const config = withStorage({
			collections: [{ slug: 'media', hooks: {} }],
		})
		const media = config.collections[0]

		const doc = {
			sourcePath: 'img/products/cards/Visa-Instant.webp',
			filename: 'Visa-Instant.webp',
			url: '/media/Visa-Instant.webp',
			mimeType: 'image/webp',
		}

		await withStorage.backend.write('/media/Visa-Instant.webp', Readable.from('visa-data'))
		const result = await media.hooks.beforeChange[0]({ doc, req: {} })

		assert.equal(result.url, '/media/img/products/cards/Visa-Instant.webp')
		assert.equal(result.filename, 'img/products/cards/Visa-Instant.webp')
		assert.equal(
			await withStorage.backend.exists('/media/img/products/cards/Visa-Instant.webp'),
			true
		)
	})

	it('prevents suffix duplicates (-1, -2) when same sourcePath or filename exists with collision overwrite/reuse', async (t) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-dedup-'))
		t.after(async () => {
			await rm(root, { recursive: true, force: true })
		})

		const withStorage = payloadSelfStorage({
			rootDir: root,
			collision: 'overwrite',
		})
		const config = withStorage({
			collections: [{ slug: 'media', hooks: {} }],
		})
		const media = config.collections[0]

		// Initial write
		await withStorage.backend.write('/media/cards/visa.webp', Readable.from('initial-data'))

		// Incoming upload that might have received a -1 suffix from standard payload upload logic
		const docWithSuffix = {
			sourcePath: 'cards/visa.webp',
			filename: 'visa-1.webp',
			url: '/media/visa-1.webp',
			mimeType: 'image/webp',
		}

		await withStorage.backend.write('/media/visa-1.webp', Readable.from('new-data'))
		const result = await media.hooks.beforeChange[0]({ doc: docWithSuffix, req: {} })

		assert.equal(result.filename, 'cards/visa.webp')
		assert.equal(result.url, '/media/cards/visa.webp')
		assert.equal(await withStorage.backend.exists('/media/cards/visa.webp'), true)
	})

	it('preserves non-image and custom extensions such as .pdf or .svg under sourcePath', async (t) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-pdf-'))
		t.after(async () => {
			await rm(root, { recursive: true, force: true })
		})

		const withStorage = payloadSelfStorage({ rootDir: root, convertImageSizesToWebp: false })
		const config = withStorage({
			collections: [{ slug: 'media', hooks: {} }],
		})
		const media = config.collections[0]

		const doc = {
			sourcePath: 'docs/specifications/report.pdf',
			filename: 'report.pdf',
			url: '/media/report.pdf',
			mimeType: 'application/pdf',
		}

		await withStorage.backend.write('/media/report.pdf', Readable.from('%PDF-1.4 sample content'))
		const result = await media.hooks.beforeChange[0]({ doc, req: {} })

		assert.equal(result.url, '/media/docs/specifications/report.pdf')
		assert.equal(result.filename, 'docs/specifications/report.pdf')
		assert.equal(result.mimeType, 'application/pdf')
		assert.equal(await withStorage.backend.exists('/media/docs/specifications/report.pdf'), true)
	})

	it('detects identical file upload by hash and marks isDuplicate while preserving canonical storage URL', async (t) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-hashdedup-'))
		t.after(async () => {
			await rm(root, { recursive: true, force: true })
		})

		const withStorage = payloadSelfStorage({ rootDir: root })
		const config = withStorage({
			collections: [{ slug: 'media', hooks: {} }],
		})
		const media = config.collections[0]

		// Existing file in storage
		await withStorage.backend.write(
			'/media/photos/avatar.webp',
			Readable.from('identical-bytes-12345')
		)

		// Incoming upload with payload suffix avatar-1.webp but identical content
		const incomingDoc = {
			sourcePath: 'photos/avatar.webp',
			filename: 'avatar-1.webp',
			url: '/media/avatar-1.webp',
			mimeType: 'image/webp',
		}

		await withStorage.backend.write('/media/avatar-1.webp', Readable.from('identical-bytes-12345'))
		const result = await media.hooks.beforeChange[0]({ doc: incomingDoc, req: {} })

		assert.equal(result.url, '/media/photos/avatar.webp')
		assert.equal(result.filename, 'photos/avatar.webp')
		assert.equal(result.isDuplicate, true)
		assert.ok(result.duplicateMessage.includes('/media/photos/avatar.webp'))
		// Verify duplicate temporary upload was removed and original remains
		assert.equal(await withStorage.backend.exists('/media/photos/avatar.webp'), true)
		assert.equal(await withStorage.backend.exists('/media/avatar-1.webp'), false)
	})

	it('preserves canonical URL on afterRead and supports nested folders fallback', async (t) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-read-'))
		t.after(async () => {
			await rm(root, { recursive: true, force: true })
		})

		const withStorage = payloadSelfStorage({ rootDir: root })
		const config = withStorage({
			collections: [
				{
					slug: 'media',
					folders: true,
					fields: [
						{ name: 'sourcePath', type: 'text' },
						{ name: 'isDuplicate', type: 'checkbox' },
					],
					hooks: {},
				},
			],
		})
		const media = config.collections[0]

		// Verify sidebar positioning
		const spField = media.fields.find((f) => f.name === 'sourcePath')
		const dupField = media.fields.find((f) => f.name === 'isDuplicate')
		assert.equal(spField?.admin?.position, 'sidebar')
		assert.equal(dupField?.admin?.position, 'sidebar')

		const doc = {
			folder: { id: 'f1', name: 'news', folder: { id: 'f0', name: '2026', folder: null } },
			filename: 'post-hero.webp',
			url: '/media/post-hero.webp',
			mimeType: 'image/webp',
		}

		await withStorage.backend.write('/media/post-hero.webp', Readable.from('hero-data'))
		const beforeResult = await media.hooks.beforeChange[0]({ doc, req: {} })

		assert.equal(beforeResult.url, '/media/2026/news/post-hero.webp')

		assert.ok(media.hooks.afterRead && media.hooks.afterRead.length > 0)
		const readResult = await media.hooks.afterRead[0]({ doc: beforeResult })
		assert.equal(readResult.url, '/media/2026/news/post-hero.webp')

		// Test afterRead with sourcePath and flat url
		const readDocWithSourcePath = {
			sourcePath: 'products/phones/item.png',
			url: '/media/item.png',
		}
		const readAfter = await media.hooks.afterRead[0]({ doc: readDocWithSourcePath })
		assert.equal(readAfter.url, '/media/products/phones/item.png')
	})

	it('resolves folder from req.data.folder or req.body.folder when doc.folder is not yet set', async (t) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-req-folder-'))
		t.after(async () => {
			await rm(root, { recursive: true, force: true })
		})

		const withStorage = payloadSelfStorage({ rootDir: root })
		const config = withStorage({
			collections: [{ slug: 'media', hooks: {} }],
		})
		const media = config.collections[0]

		const doc = {
			filename: 'sample-diagram.webp',
			url: '/media/sample-diagram.webp',
			mimeType: 'image/webp',
		}

		const mockReq = {
			data: {
				folder: 42,
			},
			payload: {
				findByID: async ({ collection, id }) => {
					if (collection === 'payload-folders' && id === 42) {
						return {
							id: 42,
							name: 'recent',
							folder: {
								id: 10,
								name: 'screenshots',
								folder: null,
							},
						}
					}
					return null
				},
			},
		}

		await withStorage.backend.write('/media/sample-diagram.webp', Readable.from('diagram-bytes'))
		const result = await media.hooks.beforeChange[0]({ doc, req: mockReq })

		assert.equal(result.url, '/media/screenshots/recent/sample-diagram.webp')
		assert.equal(result.filename, 'screenshots/recent/sample-diagram.webp')
		assert.equal(
			await withStorage.backend.exists('/media/screenshots/recent/sample-diagram.webp'),
			true
		)
	})

	it('disables synchronous imageSizes generation when lazySizes is true', async (t) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-lazy-'))
		t.after(async () => {
			await rm(root, { recursive: true, force: true })
		})

		const withStorage = payloadSelfStorage({ rootDir: root, lazySizes: true })
		const config = withStorage({
			collections: [
				{
					slug: 'media',
					upload: {
						imageSizes: [
							{ name: 'thumbnail', width: 300 },
							{ name: 'large', width: 1400 },
						],
					},
					hooks: {},
				},
			],
		})
		const media = config.collections[0]

		// Verify upload.imageSizes are empty or stripped from Payload upload processor
		assert.deepEqual(media.upload.imageSizes, [])
		assert.ok(Array.isArray(media.custom?.lazyImageSizes))
		assert.equal(media.custom.lazyImageSizes.length, 2)
	})

	it('registers isolated endpoint and serves files directly with custom mimeTypes and cacheControl', async (t) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'pss-spec-isolated-'))
		t.after(async () => {
			await rm(root, { recursive: true, force: true })
		})

		const withStorage = payloadSelfStorage({
			rootDir: root,
			publicUrlPrefix: '/media',
			isolateRouting: true,
			cacheControl: 'public, max-age=604800, stale-while-revalidate=86400',
			mimeTypes: {
				'.custom': 'application/x-custom-package',
				'.avif': 'image/avif',
			},
			thumbnailFormats: ['webp', 'png', 'jpg', 'jpeg', 'avif'],
		})

		const config = withStorage({
			collections: [{ slug: 'media', hooks: {} }],
			endpoints: [{ path: '/api/existing', method: 'get', handler: () => new Response('ok') }],
		})

		// Verify endpoint is registered
		assert.ok(Array.isArray(config.endpoints))
		const mediaEndpoint = config.endpoints.find(
			(e) => e.path === '/media/:path*' && e.method === 'get'
		)
		assert.ok(mediaEndpoint, 'media endpoint must be registered in config.endpoints')

		// Write a custom file and an avif image
		await withStorage.backend.write(
			'/media/docs/sample.custom',
			Readable.from('custom-binary-payload')
		)
		await withStorage.backend.write('/media/img/hero.avif', Readable.from('avif-binary-data'))

		// Test serving custom file via endpoint handler
		const mockReq = { url: 'http://localhost:3000/media/docs/sample.custom' }
		const response = await mediaEndpoint.handler(mockReq)
		assert.equal(response.status, 200)
		assert.equal(response.headers.get('Content-Type'), 'application/x-custom-package')
		assert.equal(
			response.headers.get('Cache-Control'),
			'public, max-age=604800, stale-while-revalidate=86400'
		)

		// Test serving avif file via endpoint handler
		const avifReq = { url: 'http://localhost:3000/media/img/hero.avif' }
		const avifResp = await mediaEndpoint.handler(avifReq)
		assert.equal(avifResp.status, 200)
		assert.equal(avifResp.headers.get('Content-Type'), 'image/avif')

		// Test 404 for non-existent file
		const notFoundReq = { url: 'http://localhost:3000/media/non-existent.png' }
		const notFoundResp = await mediaEndpoint.handler(notFoundReq)
		assert.equal(notFoundResp.status, 404)
	})

	it('registers selfStorage in config.admin.custom and selfManualDocs for Self-Manual discovery', async () => {
		const withStorage = payloadSelfStorage({ rootDir: '/tmp' })
		/** @type {any} */
		const baseConfig = {
			collections: [{ slug: 'media', hooks: {} }],
		}
		const config = withStorage(baseConfig)

		assert.ok(config.admin?.custom?.selfStorage)
		assert.equal(config.admin.custom.selfStorage.enabled, true)
		assert.equal(config.admin.custom.selfStorage.name, '@nan0web/payload-self-storage')
		assert.ok(['0.2.0', '0.3.0'].includes(config.admin.custom.selfStorage.version))
		assert.equal(config.admin.custom.selfStorage.status, 'active')

		assert.equal(config.admin.custom.selfStorage.hasDocs, true)

		assert.ok(Array.isArray(config.custom?.selfManualDocs))
		const docEntry = config.custom.selfManualDocs.find((d) => d.id === 'self-storage')
		assert.ok(docEntry, 'self-storage docs must be registered in custom.selfManualDocs')
		assert.equal(docEntry.source, '@nan0web/payload-self-storage')
	})
})
