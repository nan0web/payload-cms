import path from 'node:path'
import { resolveFolderPath } from './folder-resolver.js'
import { moveDocumentFiles } from './file-mover.js'
import { createRedirect } from '../redirects/redirect-store.js'

export function afterReadHook({ publicUrlPrefix }) {
	return async ({ doc, req }) => {
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

		if (folderPath) {
			const cleanPrefix = (publicUrlPrefix ?? '').replace(/^\/+|\/+$/g, '')
			const updateEntry = (item) => {
				if (!item) return item
				const base = path.basename(item.url || item.filename || '')
				if (!base) return item
				const targetUrl = cleanPrefix
					? `/${cleanPrefix}/${folderPath}/${base}`
					: `/${folderPath}/${base}`
				const relativeFilename = `${folderPath}/${base}`
				return {
					...item,
					url: targetUrl,
					filename: relativeFilename,
				}
			}

			if (doc.url && !doc.url.includes(`/${folderPath}/`)) {
				const updatedPrimary = updateEntry(doc)
				doc.url = updatedPrimary.url
				doc.filename = updatedPrimary.filename
			}

			if (doc.thumbnailURL && !doc.thumbnailURL.includes(`/${folderPath}/`)) {
				const thumbBase = path.basename(doc.thumbnailURL)
				doc.thumbnailURL = cleanPrefix
					? `/${cleanPrefix}/${folderPath}/${thumbBase}`
					: `/${folderPath}/${thumbBase}`
			}

			if (doc.sizes) {
				for (const [key, sizeDoc] of Object.entries(doc.sizes)) {
					if (sizeDoc && (sizeDoc.url || sizeDoc.filename)) {
						if (
							!sizeDoc.url?.includes(`/${folderPath}/`) ||
							!sizeDoc.filename?.includes(`${folderPath}/`)
						) {
							doc.sizes[key] = updateEntry(sizeDoc)
						}
					}
				}
			}
		}
		return doc
	}
}

export function beforeChangeHook({ backend, publicUrlPrefix, rootDir, convertToWebp }) {
	return async ({ doc, req }) => {
		if (!doc?.filename && !doc?.url) return doc
		return await moveDocumentFiles({
			doc,
			req,
			backend,
			publicUrlPrefix,
			rootDir,
			convertToWebp,
		})
	}
}

export function afterDeleteHook({ backend }) {
	return async ({ doc }) => {
		if (doc?.url) await backend.delete(doc.url).catch(() => {})
	}
}

/**
 * @param {{ backend: any, publicUrlPrefix?: string, rootDir: string, convertToWebp?: boolean, onRedirect?: (redirect: any) => Promise<void> | void }} options
 */
export function afterChangeHook({ backend, publicUrlPrefix, rootDir, convertToWebp, onRedirect = async (_redirect) => {} }) {
	return async ({ doc, previousDoc, req }) => {
		if (!doc?.url && !doc?.filename) return doc
		const moved = await moveDocumentFiles({
			doc,
			req,
			backend,
			publicUrlPrefix,
			rootDir,
			convertToWebp,
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
	}
}

