import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import {
	payloadRelease,
	ReleaseConfigModel,
	createReleaseFileEndpoint,
	discoverReleases,
	parseMarkdownCheckboxes,
} from '../../../../src/index.js'

describe('payload-release v0.1.0 contract', () => {
	it('exports valid plugin function and ReleaseConfigModel', () => {
		assert.equal(typeof payloadRelease, 'function')
		assert.ok(ReleaseConfigModel)
		assert.equal(typeof ReleaseConfigModel.releasesDir, 'object')
	})

	it('configures Releases collection with tabs, badges and strict read-only access', () => {
		const plugin = payloadRelease({
			releasesDir: 'releases',
			allowPreview: true,
		})

		const config = plugin({ collections: [] })
		assert.ok(Array.isArray(config.collections))
		const releasesCol = config.collections.find((c) => c.slug === 'releases')
		assert.ok(releasesCol, 'Releases collection must be registered')
		assert.equal(releasesCol.admin?.useAsTitle, 'version')

		// Verify strict Read-Only access controls
		assert.ok(releasesCol.access, 'Access configuration must exist')
		assert.equal(typeof releasesCol.access.create, 'function')
		assert.equal(releasesCol.access.create(), false, 'create access must be forbidden')
		assert.equal(typeof releasesCol.access.update, 'function')
		assert.equal(releasesCol.access.update(), false, 'update access must be forbidden')
		assert.equal(typeof releasesCol.access.delete, 'function')
		assert.equal(releasesCol.access.delete(), false, 'delete access must be forbidden')
		assert.equal(typeof releasesCol.access.read, 'function')
		assert.equal(releasesCol.access.read(), true, 'read access must be allowed')

		// Check tabs layout
		const tabsField = releasesCol.fields.find((f) => f.type === 'tabs')
		assert.ok(tabsField, 'Tabs field must exist')
		assert.ok(Array.isArray(tabsField.tabs))
		assert.equal(tabsField.tabs.length, 5)

		const resolvedLabels = tabsField.tabs.map((t) => {
			if (typeof t.label === 'function') {
				return t.label({ data: { steps: [{}], parity: [{}], issues: [{}], files: [{}] } })
			}
			return t.name || t.label
		})
		assert.ok(resolvedLabels.some((n) => typeof n === 'string' && n.includes('General')))
		assert.ok(resolvedLabels.some((n) => typeof n === 'string' && n.includes('Steps')))
		assert.ok(resolvedLabels.some((n) => typeof n === 'string' && n.includes('Parity')))
		assert.ok(resolvedLabels.some((n) => typeof n === 'string' && n.includes('Issues')))
		assert.ok(resolvedLabels.some((n) => typeof n === 'string' && n.includes('Files')))
	})

	it('supports zero-config invocation without options', () => {
		const plugin = payloadRelease()
		assert.equal(typeof plugin, 'function')

		const config = plugin({ collections: [], endpoints: [] })
		assert.ok(config.collections.some((c) => c.slug === 'releases'))
		assert.ok(Array.isArray(config.endpoints))
		assert.equal(typeof config.onInit, 'function')
	})

	it('registers release file reading endpoint', () => {
		const plugin = payloadRelease()
		const config = plugin({ collections: [], endpoints: [] })
		assert.ok(Array.isArray(config.endpoints))
		const fileEndpoint = config.endpoints.find(
			(e) => e.path === '/api/releases/:id/file' || e.path === '/releases/:id/file'
		)
		assert.ok(fileEndpoint, 'Release file endpoint must be registered')
		assert.equal(fileEndpoint.method, 'get')
		assert.equal(typeof fileEndpoint.handler, 'function')
	})

	it('safely serves file content and markdown rendering via endpoint handler', async () => {
		const handler = createReleaseFileEndpoint({
			releasesDir: 'releases',
			readReleaseFile: async (relPath) => {
				if (relPath.includes('task.md')) {
					return '# Task Spec\n\n- [x] Done item\n- [ ] Todo item'
				}
				return null
			},
		})

		const req = {
			url: 'http://payload.local/api/releases/123/file?path=0/1/v0.1.0/task.md',
			routeParams: { id: '123' },
		}

		const res = await handler(req)
		assert.equal(res.status, 200)
		const data = await res.json()
		assert.ok(data.found)
		assert.match(data.raw, /# Task Spec/)
		assert.match(data.html, /<h1>Task Spec<\/h1>/)
		assert.match(data.html, /Done item/)
	})

	it('rejects path traversal attempts in file endpoint', async () => {
		const handler = createReleaseFileEndpoint({
			releasesDir: 'releases',
			readReleaseFile: async () => 'secret',
		})

		const req = {
			url: 'http://payload.local/api/releases/123/file?path=../../etc/passwd',
			routeParams: { id: '123' },
		}

		const res = await handler(req)
		assert.equal(res.status, 400)
	})

	it('automatically discovers releases and parses task checkboxes from filesystem', async () => {
		const releases = await discoverReleases()
		assert.ok(Array.isArray(releases))
		assert.ok(releases.length >= 1)

		const v010 = releases.find((r) => r.version === 'v0.1.0')
		assert.ok(v010, 'v0.1.0 release must be discovered')
		assert.equal(v010.status, 'ok')
		assert.ok(Array.isArray(v010.files))
		assert.ok(v010.files.some((f) => f.path.endsWith('task.md')))
		assert.ok(v010.files.some((f) => f.path.endsWith('user.md')))
		assert.ok(Array.isArray(v010.steps))
		assert.ok(v010.steps.length > 0)
	})

	it('synchronizes discovered releases in onInit hook', async () => {
		const plugin = payloadRelease()
		const config = plugin({ collections: [] })

		const created = []
		const mockPayload = {
			find: async () => ({ docs: [] }),
			create: async ({ collection, data }) => {
				created.push({ collection, data })
				return data
			},
		}

		await config.onInit(mockPayload)
		assert.ok(created.length >= 1)
		assert.equal(created[0].collection, 'releases')
		assert.equal(created[0].data.version, 'v0.1.0')
	})
})
