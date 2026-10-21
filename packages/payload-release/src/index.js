import fs from 'node:fs/promises'
import path from 'node:path'
import { ReleaseConfigModel } from './domain/ReleaseConfigModel.js'
import { buildReleasesCollection, ReleasesCollection } from './collections/Releases.js'
import { createReleaseFileEndpoint } from './server/endpoint.js'
import { renderMarkdown, stripFrontmatter } from './server/markdown.js'
import {
	discoverReleases,
	parseMarkdownCheckboxes,
	getGitInfo,
	getRuntimeInfo,
	getPackageRootDir,
} from './server/discovery.js'
import {
	TourStepModel,
	TourManifestModel,
	parseTourNan0,
	mergeTourWithLocale,
} from './domain/TourStepModel.js'

export {
	ReleaseConfigModel,
	ReleasesCollection,
	buildReleasesCollection,
	createReleaseFileEndpoint,
	renderMarkdown,
	stripFrontmatter,
	discoverReleases,
	parseMarkdownCheckboxes,
	getGitInfo,
	getRuntimeInfo,
	getPackageRootDir,
	TourStepModel,
	TourManifestModel,
	parseTourNan0,
	mergeTourWithLocale,
}

/**
 * Configure payload-release plugin for Payload CMS.
 *
 * @param {Object} [options]
 * @param {string} [options.releasesDir='releases']
 * @param {boolean} [options.allowPreview=true]
 * @param {boolean} [options.autoDiscover=true]
 * @returns {(config: any) => any}
 */
export function payloadRelease(options = {}) {
	const model = new ReleaseConfigModel(options)
	const { releasesDir, allowPreview } = model
	const autoDiscover = options.autoDiscover !== false

	return (config) => {
		const packageRoot = getPackageRootDir()

		// Safe DB-FS or filesystem file reader
		const readReleaseFile = async (relPath) => {
			const projectRoot = process.cwd()
			const cleanPath = String(relPath || '')
				.replace(/^@releases\/?/, '')
				.replace(/^\.\//, '')

			const candidatePaths = [
				path.resolve(projectRoot, cleanPath),
				path.resolve(projectRoot, releasesDir, cleanPath),
				path.resolve(packageRoot, cleanPath),
				path.resolve(packageRoot, 'releases', cleanPath),
				path.resolve(packageRoot, cleanPath.replace(/^releases\/?/, 'releases/')),
			]

			const allowedBases = [
				path.resolve(projectRoot),
				path.resolve(packageRoot),
				path.resolve(packageRoot, 'releases'),
			]

			for (const fullPath of candidatePaths) {
				const isUnderAllowedBase = allowedBases.some(
					(base) => fullPath === base || fullPath.startsWith(`${base}${path.sep}`)
				)
				if (!isUnderAllowedBase) continue

				try {
					return await fs.readFile(fullPath, 'utf8')
				} catch {}
			}

			return null
		}

		const fileEndpointHandler = createReleaseFileEndpoint({
			releasesDir,
			readReleaseFile,
		})

		const collection = buildReleasesCollection({ allowPreview, fileEndpointHandler })


		const tourEndpointHandler = async (req) => {
			const url = new URL(req.url, 'http://localhost')
			const pathname = url.pathname
			const match = pathname.match(/\/releases\/([^/]+)\/tour/)
			const version = match ? match[1] : req.routeParams?.version
			const locale = (url.searchParams.get('locale') || '').toLowerCase()
			if (!version) {
				return Response.json({ error: 'Version required' }, { status: 400 })
			}

			// 1. If a specific locale is requested (and not 'en' since base is English), attempt loading localized tour manifest
			let tourContent = null
			if (locale && locale !== 'en') {
				const locCandidatePaths = [
					`releases/0/2/${version}/${locale}/tour.nan0`,
					`${version}/${locale}/tour.nan0`,
					`releases/${version}/${locale}/tour.nan0`,
					`releases/0/2/${version}/tour.${locale}.nan0`,
					`${version}/tour.${locale}.nan0`,
				]
				for (const p of locCandidatePaths) {
					tourContent = await readReleaseFile(p)
					if (tourContent) break
				}
			}

			// 2. Fallback to base tour (default English) if localized manifest not found or locale is 'en'
			if (!tourContent) {
				const baseCandidatePaths = [
					`releases/0/2/${version}/tour.nan0`,
					`${version}/tour.nan0`,
					`releases/${version}/tour.nan0`,
				]
				for (const p of baseCandidatePaths) {
					tourContent = await readReleaseFile(p)
					if (tourContent) break
				}
			}

			const tour = tourContent ? parseTourNan0(tourContent) : null

			return Response.json({
				version,
				locale: locale || 'en',
				tour,
			})
		}

		const endpoints = [
			...(Array.isArray(config.endpoints) ? config.endpoints : []),
			{
				path: '/releases/:id/file',
				method: 'get',
				handler: fileEndpointHandler,
			},
			{
				path: '/releases/view/file',
				method: 'get',
				handler: fileEndpointHandler,
			},
			{
				path: '/releases/:version/tour',
				method: 'get',
				handler: tourEndpointHandler,
			},
		]

		const existingOnInit = config.onInit
		const wrappedOnInit = async (payload) => {
			if (existingOnInit) {
				await existingOnInit(payload)
			}

			if (autoDiscover && payload?.find && payload?.create) {
				try {
					const discovered = await discoverReleases({
						projectRoot: process.cwd(),
						releasesDir,
					})

					for (const release of discovered) {
						const existing = await payload.find({
							collection: 'releases',
							where: {
								version: { equals: release.version },
							},
							limit: 1,
							depth: 0,
						})

						if (!existing?.docs?.length) {
							await payload.create({
								collection: 'releases',
								data: release,
							})
						} else {
							const doc = existing.docs[0]
							// If DB record lacks parity data or has fewer steps, sync it
							if (!Array.isArray(doc.parity) || doc.parity.length === 0) {
								await payload.update({
									collection: 'releases',
									id: doc.id,
									data: {
										parity: release.parity,
										steps: release.steps,
									},
								})
							}
						}
					}
				} catch (err) {
					payload?.logger?.warn?.(
						`[payload-release] Auto-discovery note: ${/** @type {Error} */ (err).message}`
					)
				}
			}
		}

		const existingProviders = Array.isArray(config.admin?.components?.providers)
			? config.admin.components.providers
			: config.admin?.components?.providers
				? [config.admin.components.providers]
				: []

		return {
			...config,
			admin: {
				...config.admin,
				components: {
					...config.admin?.components,
					providers: [
						...existingProviders,
						'@nan0web/payload-release/admin#ReleaseTourProvider',
					],
				},
			},
			collections: [
				...(Array.isArray(config.collections) ? config.collections : []),
				collection,
			],
			endpoints,
			onInit: wrappedOnInit,
		}
	}
}

export default payloadRelease
