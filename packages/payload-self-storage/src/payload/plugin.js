/**
 * Payload 3.x config plugin for collections using upload fields.
 * Payload remains an optional peer integration: no Payload import is required.
 */
import { createLocalFilesystemBackend } from '../storage/local-backend.js'
import { createRedirect } from '../redirects/redirect-store.js'
import path from 'node:path'
import { resolveFolderPath } from './folder-resolver.js'
import { moveDocumentFiles } from './file-mover.js'
import { createUploadHandler, serveStorageFile } from './file-server.js'

/**
 * @typedef {Object} PayloadSelfStorageOptions
 * @property {string} publicOrigin
 * @property {string} [rootDir]
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
 * @property {(redirect: object) => Promise<void>} [onRedirect]
 */

/**
 * @param {PayloadSelfStorageOptions} options
 * @returns {((config: import('payload').Config | Promise<import('payload').Config>) => Promise<import('payload').Config>) & { backend: import('../storage/local-backend.js').LocalBackend, version: string }}
 */
export function payloadSelfStorage({
	rootDir,
	publicOrigin,
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
	onRedirect = async () => {},
} = {}) {
	const backend = createLocalFilesystemBackend({
		rootDir,
		publicUrlPrefix,
		legacyLookup,
		collision,
	})

	const fileServerOptions = {
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

			return {
				...resolvedConfig,
				admin: {
					...(resolvedConfig.admin || {}),
					custom: {
						...(resolvedConfig.admin?.custom || {}),
						selfStorage: {
							enabled: true,
							name: '@nan0web/payload-self-storage',
							title: 'Self Storage',
							version: '0.2.0',
							status: 'active',
							hasDocs: true,
							docsDir: packageDocsDir,
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

						hooks: {
							...hooks,
							afterRead: [
								...(hooks.afterRead || []),
								async ({ doc, req }) => {
									if (!doc?.filename && !doc?.url) return doc
									const sourcePath = doc.sourcePath
									let folderPath = ''
									if (sourcePath && typeof sourcePath === 'string') {
										const clean = sourcePath.replace(/^\/+/, '')
										const dir = path.dirname(clean)
										folderPath = dir === '.' ? '' : dir
									} else if (doc.folder) {
										folderPath = await resolveFolderPath(doc.folder, req)
									}

									if (folderPath && doc.url && !doc.url.includes(`/${folderPath}/`)) {
										const base = path.basename(doc.url)
										const cleanPrefix = publicUrlPrefix.replace(/\/+$/, '')
										doc.url = `${cleanPrefix}/${folderPath}/${base}`
									}
									return doc
								},
							],
							beforeChange: [
								...(hooks.beforeChange || []),
								async ({ doc, req }) => {
									if (!doc?.filename && !doc?.url) return doc
									return await moveDocumentFiles({
										backend,
										doc,
										req,
										publicUrlPrefix,
										rootDir,
										convertToWebp: convertImageSizesToWebp,
									})
								},
							],
							afterDelete: [
								...(hooks.afterDelete || []),
								async ({ doc }) => {
									if (doc?.url) await backend.delete(doc.url).catch(() => {})
								},
							],
							afterChange: [
								...(hooks.afterChange || []),
								async ({ doc, previousDoc, req }) => {
									if (!doc?.url && !doc?.filename) return doc
									const moved = await moveDocumentFiles({
										backend,
										doc,
										req,
										publicUrlPrefix,
										rootDir,
										convertToWebp: convertImageSizesToWebp,
									})
									if (previousDoc?.url && moved?.url && moved.url !== previousDoc.url) {
										if (await backend.exists(previousDoc.url).catch(() => false)) {
											await backend.move(previousDoc.url, moved.url).catch(() => {})
										}
										await onRedirect(createRedirect({ from: previousDoc.url, to: moved.url }))
										if (req?.payload && req.payload.create) {
											await req.payload
												.create({
													collection: 'redirects',
													data: {
														from: previousDoc.url,
														to: { type: 'custom', url: moved.url },
													},
												})
												.catch(() => {})
										}
									}
									return moved
								},
							],
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
										const url = req?.url || ''
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
