/**
 * Payload 3.x config plugin for collections using upload fields.
 * Payload remains an optional peer integration: no Payload import is required.
 */
import { createLocalFilesystemBackend } from '../storage/local-backend.js'
import path from 'node:path'
import fs from 'node:fs'
import { createUploadHandler, serveStorageFile } from './file-server.js'
import { beforeChangeHook, afterDeleteHook, afterChangeHook, afterReadHook } from './hooks.js'

/**
 * Checks if a Next.js App Router Route Handler exists for the given publicUrlPrefix.
 *
 * @param {string} publicUrlPrefix
 * @returns {boolean}
 */
export function checkMediaRouteHandler(publicUrlPrefix) {
	if (!publicUrlPrefix || publicUrlPrefix.startsWith('/api')) return true
	const cleanPrefix = publicUrlPrefix.replace(/^\/+|\/+$/g, '')
	const cwd = process.cwd()
	const possiblePaths = [
		path.join(cwd, 'src', 'app', cleanPrefix, '[...path]', 'route.ts'),
		path.join(cwd, 'src', 'app', cleanPrefix, '[...path]', 'route.js'),
		path.join(cwd, 'src', 'app', '(frontend)', cleanPrefix, '[...path]', 'route.ts'),
		path.join(cwd, 'src', 'app', '(frontend)', cleanPrefix, '[...path]', 'route.js'),
		path.join(cwd, 'app', cleanPrefix, '[...path]', 'route.ts'),
		path.join(cwd, 'app', cleanPrefix, '[...path]', 'route.js'),
	]
	return possiblePaths.some((p) => fs.existsSync(p))
}

/**
 * @typedef {Object} PayloadSelfStorageOptions
 * @property {string} rootDir
 * @property {string} [thumbnailsDir='.thumbnails']
 * @property {string[]} [collections]
 * @property {string} [publicUrlPrefix]
 * @property {boolean} [legacyLookup]
 * @property {'reject'|'overwrite'} [collision]
 * @property {boolean} [convertImageSizesToWebp]
 * @property {boolean} [lazySizes]
 * @property {Record<string, string>} [mimeTypes]
 * @property {string} [cacheControl]
 * @property {string[]} [thumbnailFormats]
 * @property {boolean} [isolateRouting]
 * @property {(redirect: any) => Promise<void> | void} [onRedirect]
 */

/**
 * @typedef {Object} PayloadPluginProps
 * @property {import('../storage/local-backend.js').LocalBackend} backend
 * @property {string} rootDir
 */

/**
 * @typedef {((config: any) => any) & PayloadPluginProps} PayloadPluginFunction
 */

/**
 * @param {PayloadSelfStorageOptions} options
 * @returns {PayloadPluginFunction}
 */
export function payloadSelfStorage({
	rootDir,
	thumbnailsDir = '.thumbnails',
	collections = ['media'],
	publicUrlPrefix = '/media',
	legacyLookup = true,
	collision = 'reject',
	convertImageSizesToWebp = true,
	lazySizes = false,
	mimeTypes,
	cacheControl,
	thumbnailFormats,
	isolateRouting = true,
	onRedirect = async (_redirect) => {},
}) {
	const backend = createLocalFilesystemBackend({
		rootDir,
		thumbnailsDir,
		publicUrlPrefix,
		legacyLookup,
		collision,
	})

	const fileServerOptions = {
		...(thumbnailsDir ? { thumbnailsDir } : {}),
		...(mimeTypes ? { mimeTypes } : {}),
		...(cacheControl ? { cacheControl } : {}),
		...(thumbnailFormats ? { thumbnailFormats } : {}),
	}

	const serveUploadFile = createUploadHandler({
		policy: backend.policy,
		rootDir,
		...fileServerOptions,
	})

	const withSelfStorage = function withSelfStorage(config) {
		const apply = (resolvedConfig) => {
			const collectionSet = new Set(collections)
			const packageDocsDir = path.resolve(
				path.dirname(new URL(import.meta.url).pathname),
				'../../docs'
			)
			const existingManualDocs = Array.isArray(resolvedConfig.custom?.selfManualDocs)
				? resolvedConfig.custom.selfManualDocs
				: []
			const hasSelfManualRegistration = existingManualDocs.some(
				(d) => d?.source === '@nan0web/payload-self-storage'
			)
			const hasRouteHandler = checkMediaRouteHandler(publicUrlPrefix)
			const cleanPrefix = (publicUrlPrefix || '').replace(/^\/+|\/+$/g, '')
			const routeWarning = !hasRouteHandler
				? `Next.js Route Handler not found for "${publicUrlPrefix}". Requests to ${publicUrlPrefix}/* will 404 until you create app/${cleanPrefix}/[...path]/route.ts using createMediaRouteHandler.`
				: null

			const existingOnInit = resolvedConfig.onInit
			const wrappedOnInit = async (payload) => {
				if (existingOnInit) {
					await existingOnInit(payload)
				}
				if (routeWarning) {
					payload?.logger?.warn?.(`[payload-self-storage] ⚠️  ${routeWarning}`)
				}
			}

			return {
				...resolvedConfig,
				onInit: wrappedOnInit,
				admin: {
					...(resolvedConfig.admin || {}),
					custom: {
						...(resolvedConfig.admin?.custom || {}),
						selfStorage: {
							enabled: true,
							name: '@nan0web/payload-self-storage',
							title: 'Self Storage',
							version: '0.3.0',
							status: 'active',
							hasDocs: true,
							docsDir: packageDocsDir,
							hasRouteHandler,
							routeWarning,
						},
					},
				},
				custom: {
					...resolvedConfig.custom,
					selfManualDocs: hasSelfManualRegistration
						? existingManualDocs
						: [
								...existingManualDocs,
								{
									id: 'self-storage',
									source: '@nan0web/payload-self-storage',
									title: 'Self Storage',
									docsDir: packageDocsDir,
								},
							],
				},
				collections: (resolvedConfig.collections || []).map((collection) => {
					if (!collectionSet.has(collection.slug)) return collection
					const hooks = collection.hooks || {}
					const uploadConfig = collection.upload || {}
					const filenameCompoundIndex = Array.isArray(uploadConfig.filenameCompoundIndex)
						? uploadConfig.filenameCompoundIndex
						: ['filename']

					const existingFields = collection.fields || []
					const fields = [...existingFields]
					const ensureSidebarField = (name) => {
						const index = fields.findIndex((f) => f.name === name)
						if (index >= 0) {
							fields[index] = {
								...fields[index],
								admin: {
									...(fields[index].admin || {}),
									position: 'sidebar',
									defaultColumns: false,
								},
							}
						}
					}
					ensureSidebarField('sourcePath')
					ensureSidebarField('isDuplicate')
					ensureSidebarField('duplicateMessage')

					const collectionAdmin = collection.admin || {}
					const defaultColumns = collectionAdmin.defaultColumns || [
						'filename',
						'folder',
						'filesize',
						'updatedAt',
					]

					const rawImageSizes = uploadConfig.imageSizes || []
					const effectiveImageSizes = lazySizes
						? []
						: convertImageSizesToWebp
							? rawImageSizes.map((size) => ({
									...size,
									formatOptions: {
										...(size.formatOptions || {}),
										format: 'webp',
									},
								}))
							: rawImageSizes
					const hookContext = {
						backend,
						publicUrlPrefix,
						rootDir,
						convertToWebp: convertImageSizesToWebp,
						onRedirect,
					}

					return {
						...collection,
						admin: {
							...collectionAdmin,
							defaultColumns,
						},
						fields,
						custom: {
							...(collection.custom || {}),
							...(lazySizes ? { lazyImageSizes: rawImageSizes } : {}),
						},
						upload: {
							...uploadConfig,
							filenameCompoundIndex,
							staticDir: rootDir,
							staticURL: publicUrlPrefix,
							adminThumbnail:
								uploadConfig.adminThumbnail ||
								(({ doc }) => {
									return doc?.sizes?.thumbnail?.url || doc?.thumbnailURL || doc?.url
								}),
							...(convertImageSizesToWebp
								? {
										formatOptions: {
											...(collection.upload?.formatOptions || {}),
											format: 'webp',
										},
									}
								: {}),
							imageSizes: effectiveImageSizes,
							createParentPath: true,
							handlers: [...(collection.upload?.handlers || []), serveUploadFile],
						},
						endpoints: [
							...(Array.isArray(collection.endpoints) ? collection.endpoints : []),
							...(isolateRouting
								? [
										{
											path: '/file/:path*',
											method: 'get',
											handler: async (req) => {
												const url = req?.url || ''
												return serveStorageFile(backend, rootDir, url, fileServerOptions)
											},
										},
									]
								: []),
						],

						hooks: {
							...hooks,
							afterRead: [...(hooks.afterRead || []), afterReadHook(hookContext)],
							beforeChange: [...(hooks.beforeChange || []), beforeChangeHook(hookContext)],
							afterDelete: [...(hooks.afterDelete || []), afterDeleteHook(hookContext)],
							afterChange: [...(hooks.afterChange || []), afterChangeHook(hookContext)],
						},
					}
				}),
				endpoints: [
					...(Array.isArray(resolvedConfig.endpoints) ? resolvedConfig.endpoints : []),
					...(isolateRouting
						? [
								{
									path: `${publicUrlPrefix}/:path*`,
									method: 'get',
									handler: async (req) => {
										const url = req?.url || req?.pathname || ''
										return serveStorageFile(backend, rootDir, url, fileServerOptions)
									},
								},
							]
						: []),
				],
			}
		}

		if (typeof config === 'function') {
			return async (...args) => apply(await config(...args))
		}
		if (config && typeof config.then === 'function') {
			return config.then((resolvedConfig) => apply(resolvedConfig))
		}
		return apply(config)
	}

	withSelfStorage.backend = backend
	withSelfStorage.rootDir = rootDir
	return withSelfStorage
}
