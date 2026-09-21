import { createReadStream } from 'node:fs'
import { access, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

/** @type {Record<string, string>} */
export const DEFAULT_MIME_TYPES = {
	// Images
	'.webp': 'image/webp',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.avif': 'image/avif',
	'.heic': 'image/heic',
	'.heif': 'image/heif',
	'.bmp': 'image/bmp',
	'.ico': 'image/x-icon',
	'.tiff': 'image/tiff',
	// Documents
	'.pdf': 'application/pdf',
	'.json': 'application/json',
	'.xml': 'application/xml',
	'.txt': 'text/plain',
	'.csv': 'text/csv',
	'.doc': 'application/msword',
	'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'.xls': 'application/vnd.ms-excel',
	'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'.ppt': 'application/vnd.ms-powerpoint',
	'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	// Audio
	'.mp3': 'audio/mpeg',
	'.wav': 'audio/wav',
	'.ogg': 'audio/ogg',
	'.m4a': 'audio/mp4',
	'.flac': 'audio/flac',
	// Video
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
	'.ogv': 'video/ogg',
	'.mov': 'video/quicktime',
	// Fonts
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.otf': 'font/otf',
	'.eot': 'application/vnd.ms-fontobject',
	// Archives
	'.zip': 'application/zip',
	'.tar': 'application/x-tar',
	'.gz': 'application/gzip',
}

export const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable'
export const DEFAULT_THUMBNAIL_FORMATS = ['webp', 'png', 'jpg', 'jpeg', 'avif']

/**
 * Recursively search a directory for a given filename.
 * @param {string} dir
 * @param {string} targetBasename
 * @returns {Promise<string|null>}
 */
export async function findRecursive(dir, targetBasename) {
	try {
		const decodedTarget = decodeURIComponent(targetBasename)
		const entries = await readdir(dir, { withFileTypes: true })
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)
			if (entry.isDirectory()) {
				const found = await findRecursive(fullPath, decodedTarget)
				if (found) return found
			} else if (entry.name === decodedTarget || entry.name === targetBasename) {
				return fullPath
			}
		}
	} catch {}
	return null
}

/**
 * Generates resized image thumbnail on demand using Sharp if available.
 *
 * @param {string} rootDir
 * @param {string} filename
 * @param {Object} [options]
 * @param {string[]} [options.thumbnailFormats]
 * @returns {Promise<string|null>}
 */
export async function generateThumbnailOnDemand(rootDir, filename, { thumbnailFormats = DEFAULT_THUMBNAIL_FORMATS } = {}) {
	const decoded = decodeURIComponent(filename)
	const supportedFormatsPattern = (thumbnailFormats && thumbnailFormats.length > 0)
		? thumbnailFormats.join('|')
		: DEFAULT_THUMBNAIL_FORMATS.join('|')
	const regex = new RegExp(`^(.+)-(\\d+)x(\\d+)\\.(${supportedFormatsPattern})$`, 'i')
	const match = decoded.match(regex)
	if (!match) return null
	const [, base, widthStr, heightStr, ext] = match
	const width = parseInt(widthStr, 10)
	const height = parseInt(heightStr, 10)

	let masterPath = await findRecursive(rootDir, `${base}.${ext}`)
	if (!masterPath) {
		for (const altExt of thumbnailFormats) {
			masterPath = await findRecursive(rootDir, `${base}.${altExt}`)
			if (masterPath) break
		}
	}
	if (!masterPath) return null

	try {
		const sharpModule = await import('sharp')
		const sharp = sharpModule.default || sharpModule
		const targetPath = path.join(path.dirname(masterPath), decoded)
		await sharp(masterPath).resize(width, height, { fit: 'cover' }).toFile(targetPath)
		return targetPath
	} catch {
		return masterPath
	}
}

/**
 * Returns an HTTP response streaming the requested file with caching headers.
 * @param {string} filePath
 * @param {Object} [options]
 * @param {Record<string, string>} [options.mimeTypes]
 * @param {string} [options.cacheControl]
 * @returns {() => Promise<Response>}
 */
export function respondWithFile(filePath, { mimeTypes = DEFAULT_MIME_TYPES, cacheControl = DEFAULT_CACHE_CONTROL } = {}) {
	return async () => {
		try {
			const fileStat = await stat(filePath)
			const stream = createReadStream(filePath)
			const ext = path.extname(filePath).toLowerCase()
			const contentType = mimeTypes[ext] || DEFAULT_MIME_TYPES[ext] || 'application/octet-stream'
			return new Response(/** @type {any} */ (stream), {
				status: 200,
				headers: {
					'Content-Type': contentType,
					'Content-Length': fileStat.size.toString(),
					'Cache-Control': cacheControl,
				},
			})
		} catch {
			return new Response('File Not Found', { status: 404 })
		}
	}
}

/**
 * Creates custom upload handler for on-demand file serving during GET requests.
 * Compatible with Payload's Collection `upload.handlers` specification.
 *
 * @see {@link import('payload').UploadConfig['handlers']}
 *
 * @param {Object} options
 * @param {any} options.policy
 * @param {string} options.rootDir
 * @param {Record<string, string>} [options.mimeTypes]
 * @param {string} [options.cacheControl]
 * @returns {(req: import('payload').PayloadRequest, context: { doc: import('payload').TypeWithID, params: { filename?: string, collection?: string, prefix?: string } }) => Promise<Response|null>}
 */
export function createUploadHandler({ policy, rootDir, mimeTypes = DEFAULT_MIME_TYPES, cacheControl = DEFAULT_CACHE_CONTROL }) {
	return async function serveUploadFile(_req, context) {
		const { doc, params } = context

		if (params?.filename) {
			const filename = decodeURIComponent(params.filename)

			if (doc?.sizes) {
				for (const [, sizeDoc] of Object.entries(doc.sizes)) {
					if (sizeDoc?.url) {
						const urlPath = policy.storageKey(sizeDoc.url)
						const filePath = path.join(rootDir, urlPath)
						try {
							await access(filePath)
							return respondWithFile(filePath, { mimeTypes, cacheControl })()
						} catch {}
					}
				}
			}

			if (doc?.url) {
				const urlPath = policy.storageKey(doc.url)
				const filePath = path.join(rootDir, urlPath)
				try {
					await access(filePath)
					return respondWithFile(filePath, { mimeTypes, cacheControl })()
				} catch {}
			}

			const foundPath = await findRecursive(rootDir, filename)
			if (foundPath) {
				return respondWithFile(foundPath, { mimeTypes, cacheControl })()
			}
		}

		return null
	}
}

/**
 * Direct file server helper for custom storage routes.
 *
 * @param {any} backend
 * @param {string} rootDir
 * @param {string} reqUrl
 * @param {Object} [options]
 * @param {Record<string, string>} [options.mimeTypes]
 * @param {string} [options.cacheControl]
 * @param {string[]} [options.thumbnailFormats]
 * @returns {Promise<Response>}
 */
export async function serveStorageFile(backend, rootDir, reqUrl, {
	mimeTypes = DEFAULT_MIME_TYPES,
	cacheControl = DEFAULT_CACHE_CONTROL,
	thumbnailFormats = DEFAULT_THUMBNAIL_FORMATS,
} = {}) {
	try {
		const cleanUrl = decodeURIComponent(reqUrl)
		let filePath
		try {
			filePath = await backend.locate(cleanUrl)
		} catch {
			const rawPath = new URL(reqUrl, 'http://local').pathname
			const filename = decodeURIComponent(path.basename(rawPath))
			filePath = await findRecursive(rootDir, filename)
			if (!filePath) {
				filePath = await generateThumbnailOnDemand(rootDir, filename, { thumbnailFormats })
			}
		}
		if (!filePath) return new Response('File Not Found', { status: 404 })

		const fileStat = await stat(filePath)
		const stream = createReadStream(filePath)
		const ext = path.extname(filePath).toLowerCase()
		const contentType = mimeTypes[ext] || DEFAULT_MIME_TYPES[ext] || 'application/octet-stream'

		return new Response(/** @type {any} */ (stream), {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Content-Length': fileStat.size.toString(),
				'Cache-Control': cacheControl,
			},
		})
	} catch {
		return new Response('File Not Found', { status: 404 })
	}
}
