import path from 'node:path'
import { resolveTargetFolder } from './folder-resolver.js'

const WEBP_MIME_TYPE = 'image/webp'

/**
 * Returns all file entries (original and sizes) from a Payload document.
 * @param {any} doc
 * @returns {Array<{ key: string, file: any }>}
 */
export function fileEntries(doc) {
	return [
		{ key: 'original', file: doc },
		...Object.entries(doc?.sizes || {}).map(([key, file]) => ({ key, file })),
	].filter(({ file }) => file?.url || file?.filename)
}

/**
 * Strips duplicate suffixes like -1, -2 appended by collision handlers.
 * @param {string} basename
 * @returns {string}
 */
export function stripDuplicateSuffix(basename) {
	return basename.replace(/(-\d+)+$/, '')
}

/**
 * Cleans alt text fallback from a filename.
 * @param {string} filename
 * @returns {string}
 */
export function cleanAltFromFilename(filename) {
	if (!filename) return ''
	const decoded = decodeURIComponent(filename)
	const nameWithoutExt = path.basename(decoded, path.extname(decoded))
	return nameWithoutExt.replace(/[-_]+/g, ' ').trim()
}

/**
 * Computes updated file metadata with canonical URL and extension formatting.
 *
 * @param {any} file
 * @param {string} url
 * @param {string} publicUrlPrefix
 * @param {string} [customBasename]
 * @param {boolean} [convertToWebp=true]
 * @returns {any}
 */
export function computeFileMetadata(
	file,
	url,
	publicUrlPrefix,
	customBasename,
	convertToWebp = true
) {
	if (!file) return file
	const originalExt = path.extname(file.filename || url || '')
	const base = customBasename
		? customBasename.replace(/\.[^/.]+$/, '')
		: path.basename(file.filename || url, originalExt)

	const targetExt =
		convertToWebp &&
		(!originalExt || ['.jpg', '.jpeg', '.png', '.webp'].includes(originalExt.toLowerCase()))
			? '.webp'
			: originalExt || '.webp'
	const mimeType =
		targetExt === '.webp' ? WEBP_MIME_TYPE : file.mimeType || 'application/octet-stream'

	const filename = `${base}${targetExt}`
	const dir = path.dirname(url)
	const targetUrl = `${dir}/${filename}`
	const prefix = publicUrlPrefix.endsWith('/') ? publicUrlPrefix : `${publicUrlPrefix}/`
	const serverUrl = targetUrl.startsWith(prefix) ? targetUrl.slice(prefix.length) : targetUrl
	return { ...file, filename: serverUrl, url: targetUrl, serverUrl, mimeType }
}

/**
 * Moves document files to their canonical physical folder paths and deduplicates.
 *
 * @param {Object} params
 * @param {any} params.backend
 * @param {any} params.doc
 * @param {any} params.req
 * @param {string} params.publicUrlPrefix
 * @param {string} [params.rootDir]
 * @param {boolean} [params.convertToWebp=true]
 * @returns {Promise<any>}
 */
export async function moveDocumentFiles({
	backend,
	doc,
	req,
	publicUrlPrefix,
	convertToWebp = true,
}) {
	const { folderPath, customBasename, customExt } = await resolveTargetFolder({
		doc,
		req,
	})

	const updated = { ...doc, sizes: doc.sizes ? { ...doc.sizes } : doc }
	if (!doc.sizes) delete updated.sizes

	// Auto-fill alt if missing
	const primaryFilename = doc.filename || (doc.url ? path.basename(doc.url) : '')
	if (!updated.alt && primaryFilename) {
		updated.alt = cleanAltFromFilename(primaryFilename)
	}

	let duplicateFound = false

	for (const { key, file } of fileEntries(doc)) {
		const rawFilename = file.filename || path.basename(file.url || '')
		const rawExt = path.extname(rawFilename)
		let base =
			customBasename && key === 'original' ? customBasename : path.basename(rawFilename, rawExt)

		// Strip duplicate suffixes like -1, -2 generated during collision by payload upload handler
		base = stripDuplicateSuffix(base)

		const targetExt =
			customExt ||
			(convertToWebp &&
			(!rawExt || ['.jpg', '.jpeg', '.png', '.webp'].includes(rawExt.toLowerCase()))
				? '.webp'
				: rawExt)
		const oldUrl = file.url || `${publicUrlPrefix}/${rawFilename}`
		const flatUrl = `${publicUrlPrefix}/${path.basename(oldUrl)}`
		const flatTargetUrl = `${publicUrlPrefix}/${base}${targetExt}`
		const folderPrefix = folderPath
			? `${publicUrlPrefix}/${folderPath}`
			: file.url
				? path.dirname(file.url)
				: publicUrlPrefix
		const newUrl = `${folderPrefix}/${base}${targetExt}`

		// Find which source file exists on disk
		let existingSourceUrl = null
		if (await backend.exists(oldUrl).catch(() => false)) {
			existingSourceUrl = oldUrl
		} else if (
			flatTargetUrl !== newUrl &&
			(await backend.exists(flatTargetUrl).catch(() => false))
		) {
			existingSourceUrl = flatTargetUrl
		} else if (flatUrl !== newUrl && (await backend.exists(flatUrl).catch(() => false))) {
			existingSourceUrl = flatUrl
		}

		// Fast-Path Deduplication: Check if target file already exists and compare size + hash
		let fileIsDuplicate = false
		const targetExists = backend.existsExact
			? backend.existsExact.bind(backend)
			: backend.exists.bind(backend)

		if (
			existingSourceUrl &&
			existingSourceUrl !== newUrl &&
			(await targetExists(newUrl).catch(() => false))
		) {
			const isIdentical = await backend.compare(existingSourceUrl, newUrl).catch(() => false)
			if (isIdentical) {
				duplicateFound = true
				fileIsDuplicate = true
				// Clean up the temporary duplicate uploaded by Payload
				await backend.delete(existingSourceUrl).catch(() => {})
			}
		}

		if (!fileIsDuplicate && existingSourceUrl && existingSourceUrl !== newUrl) {
			try {
				await backend.move(existingSourceUrl, newUrl)
			} catch {}
		}

		const metadata = computeFileMetadata(file, newUrl, publicUrlPrefix, base, convertToWebp)
		if (key === 'original') Object.assign(updated, metadata)
		else updated.sizes[key] = metadata
	}

	if (duplicateFound) {
		updated.isDuplicate = true
		updated.duplicateMessage = `Duplicate file found and matched with existing canonical storage path: ${updated.url}`
	}

	return updated
}
