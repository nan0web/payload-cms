import path from 'node:path'

/**
 * Extracts folder ID if folder is an object or primitive.
 * @param {any} folder
 * @returns {string|number|null|undefined}
 */
export function folderId(folder) {
	return folder && typeof folder === 'object' ? folder.id : folder
}

/**
 * Recursively resolves the physical folder path from a Payload folder entity or ID.
 * Supports Payload 3.x folder structure (slug or name) and searches req.payload.findByID if ID given.
 *
 * @param {any} folder - Folder ID, folder object or nested folder reference
 * @param {any} [req] - Payload request object with access to payload.findByID
 * @returns {Promise<string>} Resolved folder path without leading/trailing slashes (e.g. 'screenshots/recent')
 */
export async function resolveFolderPath(folder, req) {
	if (!folder) return ''
	if (typeof folder === 'string' && folder.includes('/')) {
		return folder.replace(/^\/+|\/+$/g, '')
	}
	const parts = []
	let current = folder
	const seen = new Set()

	while (current) {
		const id = folderId(current)
		if (id && seen.has(id)) break
		if (id) seen.add(id)

		if (typeof current === 'string' || typeof current === 'number') {
			if (!req?.payload?.findByID) break
			try {
				current = await req.payload.findByID({
					collection: 'payload-folders',
					id: current,
					depth: 0,
				})
			} catch {
				break
			}
			if (!current) break
		}

		const segment = current.name || current.slug
		if (segment) parts.unshift(segment)
		current = current.folder
	}

	return parts.filter(Boolean).join('/')
}

/**
 * Resolves target folder path from document and request context.
 * Checks doc.sourcePath first, then doc.folder, req.data.folder, req.body.folder.
 *
 * @param {Object} params
 * @param {any} params.doc
 * @param {any} params.req
 * @returns {Promise<{ folderPath: string, customBasename: string, customExt: string }>}
 */
export async function resolveTargetFolder({ doc, req }) {
	const sourcePath = doc?.sourcePath || req?.data?.sourcePath || req?.body?.sourcePath
	let folderPath = ''
	let customBasename = ''
	let customExt = ''

	if (sourcePath && typeof sourcePath === 'string') {
		const cleanSourcePath = sourcePath.replace(/^\/+/, '')
		const dir = path.dirname(cleanSourcePath)
		folderPath = dir === '.' ? '' : dir
		customExt = path.extname(cleanSourcePath)
		customBasename = path.basename(cleanSourcePath, customExt)
	} else {
		const targetFolder = doc?.folder || req?.data?.folder || req?.body?.folder
		folderPath = await resolveFolderPath(targetFolder, req)
	}

	return { folderPath, customBasename, customExt }
}
