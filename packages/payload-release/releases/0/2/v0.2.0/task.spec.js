import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import {
	TourStepModel,
	TourManifestModel,
	parseTourNan0,
} from '../../../../src/domain/TourStepModel.js'
import { discoverReleases } from '../../../../src/server/discovery.js'
import { payloadRelease } from '../../../../src/index.js'

describe('payload-release v0.2.0: Tour & Onboarding Contract', () => {
	it('validates individual tour steps via TourStepModel', () => {
		assert.ok(TourStepModel)
		const validStep = new TourStepModel({
			step: 1,
			route: '/admin',
			target: 'nav a[href*="/releases"]',
			title: 'Releases Menu',
			content: 'Explore version history and releases.',
			position: 'right',
			action: 'click',
		})

		assert.equal(validStep.step, 1)
		assert.equal(validStep.route, '/admin')
		assert.equal(validStep.action, 'click')
		assert.equal(validStep.position, 'right')
	})

	it('validates complete tour manifest with TourManifestModel', () => {
		assert.ok(TourManifestModel)
		const manifest = new TourManifestModel({
			version: '0.2.0',
			title: 'v0.2.0 Tour',
			steps: [
				{
					step: 1,
					route: '/admin',
					target: 'nav a',
					title: 'Nav',
					content: 'Navigation step',
				},
			],
		})

		assert.equal(manifest.version, '0.2.0')
		assert.equal(manifest.steps.length, 1)
		assert.equal(manifest.steps[0].step, 1)
	})

	it('parses tour.nan0 format into structured manifest', () => {
		const rawTour = `
version: 0.2.0
title: "Tour v0.2.0"

steps:
  - step: 1
    route: "/admin"
    target: "nav a"
    title: "Step 1 Title"
    content: "Step 1 Content"
    position: "right"
    action: "click"
  - step: 2
    route: "/admin/releases"
    target: ".release-item"
    title: "Step 2 Title"
    content: "Step 2 Content"
    action: "next"
`
		const parsed = parseTourNan0(rawTour)
		assert.ok(parsed)
		assert.equal(parsed.version, '0.2.0')
		assert.equal(parsed.title, 'Tour v0.2.0')
		assert.equal(parsed.steps.length, 2)
		assert.equal(parsed.steps[0].target, 'nav a')
		assert.equal(parsed.steps[0].action, 'click')
		assert.equal(parsed.steps[1].action, 'next')
	})

	it('automatically discovers tour.nan0 files in release directories', async () => {
		const releases = await discoverReleases()
		const v020 = releases.find((r) => r.version === 'v0.2.0')
		assert.ok(v020, 'v0.2.0 release must be discovered')
		assert.ok(v020.tour, 'v0.2.0 must have parsed tour attached')
		assert.equal(v020.tour.version, '0.2.0')
		assert.ok(Array.isArray(v020.tour.steps))
		assert.ok(v020.tour.steps.length >= 2)
		assert.ok(v020.files.some((f) => f.path.endsWith('tour.nan0')))
	})

	it('configures Releases collection with tour field and tour endpoints', () => {
		const plugin = payloadRelease()
		const config = plugin({ collections: [], endpoints: [] })
		const col = config.collections.find((c) => c.slug === 'releases')
		assert.ok(col)

		// Check tour field existence
		const hasTourField = col.fields.some(
			(f) => f.name === 'tour' || (f.type === 'tabs' && f.tabs.some((t) => t.fields?.some((tf) => tf.name === 'tour')))
		)
		assert.ok(hasTourField, 'Releases collection must include tour configuration field')

		// Check tour endpoints
		const tourEndpoint = config.endpoints.find(
			(e) => e.path === '/releases/:version/tour' || e.path === '/api/releases/:version/tour'
		)
		assert.ok(tourEndpoint, 'Endpoint for tour discovery must be registered')
	})

	it('supports multilingual tour discovery (uk and en) via endpoint', async () => {
		const plugin = payloadRelease()
		const config = plugin({ collections: [], endpoints: [] })
		const tourEndpoint = config.endpoints.find((e) => e.path === '/releases/:version/tour')
		assert.ok(tourEndpoint)

		// Query English version
		const reqEn = {
			url: 'http://localhost/releases/v0.2.0/tour?locale=en',
			routeParams: { version: 'v0.2.0' },
		}
		const resEn = await tourEndpoint.handler(reqEn)
		assert.equal(resEn.status, 200)
		const dataEn = await resEn.json()
		assert.equal(dataEn.locale, 'en')
		assert.ok(dataEn.tour)
		assert.match(dataEn.tour.title, /Update v0\.2\.0/i)

		// Query Ukrainian version
		const reqUk = {
			url: 'http://localhost/releases/v0.2.0/tour?locale=uk',
			routeParams: { version: 'v0.2.0' },
		}
		const resUk = await tourEndpoint.handler(reqUk)
		assert.equal(resUk.status, 200)
		const dataUk = await resUk.json()
		assert.equal(dataUk.locale, 'uk')
		assert.ok(dataUk.tour)
		assert.match(dataUk.tour.title, /Оновлення v0\.2\.0/i)
	})
})
