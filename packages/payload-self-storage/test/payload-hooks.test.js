import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { Readable } from 'node:stream'
import os from 'node:os'
import path from 'node:path'
import {
	beforeChangeHook,
	afterChangeHook,
	afterReadHook,
	afterDeleteHook,
} from '../src/payload/hooks.js'
import { createLocalFilesystemBackend } from '../src/storage/local-backend.js'

const roots = []
afterEach(async () => {
	await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('Payload lifecycle hooks unit tests', () => {
	it('beforeChangeHook moves file and updates metadata (folder resolution + WebP format)', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'hooks-test-')); roots.push(root)
		const backend = createLocalFilesystemBackend({ rootDir: root })

		const hook = beforeChangeHook({
			backend,
			publicUrlPrefix: '/media',
			rootDir: root,
			convertToWebp: true,
		})

		const doc = {
			filename: 'logo.png',
			url: '/media/logo.png',
			mimeType: 'image/png',
			folder: { slug: 'branding', folder: null },
		}

		await backend.write('/media/logo.png', Readable.from('logo-png-data'))

		const resultDoc = await hook({ doc, req: {} })

		assert.equal(resultDoc.filename, 'branding/logo.webp')
		assert.equal(resultDoc.url, '/media/branding/logo.webp')
		assert.equal(resultDoc.mimeType, 'image/webp')
		assert.equal(await backend.exists('/media/branding/logo.webp'), true)
	})

	it('afterChangeHook triggers onRedirect and moves previous files on path update', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'hooks-test-')); roots.push(root)
		const backend = createLocalFilesystemBackend({ rootDir: root })

		const redirects = []
		const hook = afterChangeHook({
			backend,
			publicUrlPrefix: '/media',
			rootDir: root,
			convertToWebp: true,
			onRedirect: async (redirect) => { redirects.push(redirect) },
		})

		const oldUrl = '/media/logo.webp'
		const newUrl = '/media/branding/logo.webp'

		await backend.write(oldUrl, Readable.from('logo-data'))

		const doc = {
			url: newUrl,
			filename: 'branding/logo.webp',
			folder: { slug: 'branding', folder: null },
		}
		const previousDoc = { url: oldUrl, filename: 'logo.webp' }

		const resultDoc = await hook({ doc, previousDoc, req: {} })

		assert.equal(resultDoc.url, newUrl)
		assert.equal(await backend.exists(oldUrl), false)
		assert.equal(await backend.exists(newUrl), true)
		assert.equal(redirects.length, 1)
		assert.equal(redirects[0].from, oldUrl)
		assert.equal(redirects[0].to, newUrl)
	})

	it('afterReadHook injects folderPath into URL if doc is missing folder in stored URL', async () => {
		const hook = afterReadHook({ publicUrlPrefix: '/media' })

		const doc = {
			filename: 'avatar.webp',
			url: '/media/avatar.webp',
			folder: { slug: 'users', folder: null },
		}

		const resultDoc = await hook({ doc, req: {} })

		assert.equal(resultDoc.url, '/media/users/avatar.webp')
		assert.equal(resultDoc.filename, 'users/avatar.webp')
	})

	it('afterDeleteHook deletes file from storage', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'hooks-test-')); roots.push(root)
		const backend = createLocalFilesystemBackend({ rootDir: root })

		const hook = afterDeleteHook({ backend })
		const fileUrl = '/media/photos/vacation.webp'

		await backend.write(fileUrl, Readable.from('photo-bytes'))
		assert.equal(await backend.exists(fileUrl), true)

		await hook({ doc: { url: fileUrl } })

		assert.equal(await backend.exists(fileUrl), false)
	})
})
