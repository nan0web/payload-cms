import { createReadStream } from 'node:fs'
import { access, readdir, stat, mkdir, copyFile } from 'node:fs/promises'
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
 * Generates resized image thumbnail on demand using Sharp if available,
 * caching it in options.thumbnailsDir.
 *
 * @param {string} rootDir
 * @param {string} filename
 * @param {Object} [options]
 * @param {string} [options.thumbnailsDir]
 * @param {string[]} [options.thumbnailFormats]
 * @returns {Promise<string|null>}
 */
export async function generateThumbnailOnDemand(
	rootDir,
	filename,
	{ thumbnailsDir, thumbnailFormats = DEFAULT_THUMBNAIL_FORMATS } = {}
) {
	const decoded = decodeURIComponent(filename)
	const supportedFormatsPattern =
		thumbnailFormats && thumbnailFormats.length > 0
			? thumbnailFormats.join('|')
			: DEFAULT_THUMBNAIL_FORMATS.join('|')
	const regex = new RegExp(`^(.+)-(\\d+)x(\\d+)\\.(${supportedFormatsPattern})$`, 'i')
	const match = decoded.match(regex)
	if (!match) return null
	const [, base, widthStr, heightStr, ext] = match
	const width = parseInt(widthStr, 10)
	const height = parseInt(heightStr, 10)

	const thumbsDir = thumbnailsDir
		? path.resolve(thumbnailsDir)
		: path.resolve(rootDir, '.thumbnails')
	const cachedThumbPath = path.join(thumbsDir, decoded)

	// Check if already generated in thumbnailsDir
	try {
		await access(cachedThumbPath)
		return cachedThumbPath
	} catch {}

	let masterPath = await findRecursive(rootDir, `${base}.${ext}`)
	if (!masterPath) {
		for (const altExt of thumbnailFormats) {
			masterPath = await findRecursive(rootDir, `${base}.${altExt}`)
			if (masterPath) break
		}
	}
	if (!masterPath) return null

	try {
		await mkdir(thumbsDir, { recursive: true })
		const sharpModule = await import('sharp')
		const sharp = sharpModule.default || sharpModule
		await sharp(masterPath).resize(width, height, { fit: 'cover' }).toFile(cachedThumbPath)
		return cachedThumbPath
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
export function respondWithFile(
	filePath,
	{ mimeTypes = DEFAULT_MIME_TYPES, cacheControl = DEFAULT_CACHE_CONTROL } = {}
) {
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
 * @returns {(req: import('payload').PayloadRequest, context: { doc: import('payload').TypeWithID & { url?: string, filename?: string, sizes?: Record<string, { url?: string, filename?: string }> }, params: { filename?: string, collection?: string, prefix?: string } }) => Promise<Response|null>}
 */
export function createUploadHandler({
	policy,
	rootDir,
	mimeTypes = DEFAULT_MIME_TYPES,
	cacheControl = DEFAULT_CACHE_CONTROL,
}) {
	return async function serveUploadFile(_req, context) {
		const { doc, params } = context

		if (params?.filename) {
			const filename = decodeURIComponent(params.filename)
			const baseRequested = path.basename(filename)

			// 1. Direct match in doc.sizes
			if (doc?.sizes) {
				for (const [, sizeDoc] of Object.entries(doc.sizes)) {
					const sizeFilename = sizeDoc?.filename ? decodeURIComponent(sizeDoc.filename) : ''
					const sizeUrl = sizeDoc?.url ? decodeURIComponent(sizeDoc.url) : ''
					if (
						sizeFilename === filename ||
						path.basename(sizeFilename) === baseRequested ||
						path.basename(sizeUrl) === baseRequested
					) {
						const resolvedRelative = sizeFilename || (sizeUrl ? policy.storageKey(sizeUrl) : '')
						if (resolvedRelative) {
							const filePath = path.join(rootDir, resolvedRelative)
							try {
								await access(filePath)
								return respondWithFile(filePath, { mimeTypes, cacheControl })()
							} catch {}
						}
					}
				}
			}

			// 2. Direct match in doc original
			if (doc?.url || doc?.filename) {
				const docFilename = doc.filename ? decodeURIComponent(doc.filename) : ''
				const docUrl = doc.url ? decodeURIComponent(doc.url) : ''
				if (
					docFilename === filename ||
					path.basename(docFilename) === baseRequested ||
					path.basename(docUrl) === baseRequested
				) {
					const resolvedRelative = docFilename || (docUrl ? policy.storageKey(docUrl) : '')
					if (resolvedRelative) {
						const filePath = path.join(rootDir, resolvedRelative)
						try {
							await access(filePath)
							return respondWithFile(filePath, { mimeTypes, cacheControl })()
						} catch {}
					}
				}
			}

			// 3. Fallback to direct path in rootDir
			const directPath = path.join(rootDir, filename)
			try {
				await access(directPath)
				return respondWithFile(directPath, { mimeTypes, cacheControl })()
			} catch {}
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
 * @param {string} [options.thumbnailsDir]
 * @param {string[]} [options.thumbnailFormats]
 * @returns {Promise<Response>}
 */
export async function serveStorageFile(
	backend,
	rootDir,
	reqUrl,
	{
		mimeTypes = DEFAULT_MIME_TYPES,
		cacheControl = DEFAULT_CACHE_CONTROL,
		thumbnailsDir,
		thumbnailFormats = DEFAULT_THUMBNAIL_FORMATS,
	} = {}
) {
	try {
		const rawPath = reqUrl.startsWith('http') ? new URL(reqUrl).pathname : reqUrl
		let cleanUrl = decodeURIComponent(rawPath)

		// Strip /api prefix if present (Payload 3 App Router mounts endpoints under /api)
		if (cleanUrl.startsWith('/api/')) {
			cleanUrl = cleanUrl.slice(4)
		}

		let filePath
		try {
			filePath = await backend.locate(cleanUrl)
		} catch {
			const filename = decodeURIComponent(path.basename(cleanUrl))
			const thumbsDir = thumbnailsDir ? path.resolve(thumbnailsDir) : path.resolve(rootDir, '.thumbnails')
			const directThumb = path.join(thumbsDir, filename)
			try {
				await access(directThumb)
				filePath = directThumb
			} catch {
				filePath = await findRecursive(rootDir, filename)
				if (!filePath) {
					filePath = await generateThumbnailOnDemand(rootDir, filename, { thumbnailsDir: thumbsDir, thumbnailFormats })
				}
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

/**
 * Copies generated thumbnails from thumbnailsDir into the static distribution directory.
 * Ensures thumbnails exist in static build outputs (out/ or public/) for static servers.
 *
 * @param {Object} options
 * @param {string} options.thumbnailsDir
 * @param {string} options.targetDir
 * @returns {Promise<{ copied: number }>}
 */
export async function syncThumbnailsToStatic({ thumbnailsDir, targetDir }) {
	let copied = 0
	try {
		await mkdir(targetDir, { recursive: true })
		const entries = await readdir(thumbnailsDir, { withFileTypes: true })
		for (const entry of entries) {
			if (entry.isFile() && !entry.name.startsWith('.')) {
				const src = path.join(thumbnailsDir, entry.name)
				const dest = path.join(targetDir, entry.name)
				await copyFile(src, dest)
				copied++
			}
		}
	} catch {}
	return { copied }
}

/**
 * Synchronizes entire storage (including generated thumbnails) into a static distribution directory (SSG).
 * Recursively copies all original media and cached thumbnails, preserving structure.
 *
 * @param {Object} options
 * @param {string} options.rootDir
 * @param {string} options.targetDir
 * @param {string} [options.thumbnailsDir]
 * @returns {Promise<{ copiedFiles: number }>}
 */
export async function syncStorageToDist({ rootDir, targetDir, thumbnailsDir }) {
	let copiedFiles = 0
	const resolvedThumbs = thumbnailsDir
		? path.resolve(thumbnailsDir)
		: path.resolve(rootDir, '.thumbnails')

	async function copyTree(srcDir, destDir) {
		await mkdir(destDir, { recursive: true })
		const entries = await readdir(srcDir, { withFileTypes: true })
		for (const entry of entries) {
			if (entry.name.startsWith('.')) continue
			const srcPath = path.join(srcDir, entry.name)
			const destPath = path.join(destDir, entry.name)
			if (entry.isDirectory()) {
				if (path.resolve(srcPath) === resolvedThumbs) continue
				await copyTree(srcPath, destPath)
			} else if (entry.isFile()) {
				await copyFile(srcPath, destPath)
				copiedFiles++
			}
		}
	}

	try {
		await copyTree(rootDir, targetDir)
	} catch {}

	// Also copy thumbnails if they exist into targetDir root or corresponding subpath
	try {
		const thumbEntries = await readdir(resolvedThumbs, { withFileTypes: true })
		for (const entry of thumbEntries) {
			if (entry.isFile() && !entry.name.startsWith('.')) {
				const src = path.join(resolvedThumbs, entry.name)
				const dest = path.join(targetDir, entry.name)
				await copyFile(src, dest)
				copiedFiles++
			}
		}
	} catch {}

	return { copiedFiles }
}

/**
 * Creates a Next.js App Router Route Handler (GET) for serving media files directly.
 *
 * @param {Object} [options]
 * @param {any} [options.backend]
 * @param {string} [options.rootDir]
 * @param {string} [options.publicUrlPrefix]
 * @param {string} [options.thumbnailsDir]
 * @param {string[]} [options.thumbnailFormats]
 * @param {Record<string, string>} [options.mimeTypes]
 * @param {string} [options.cacheControl]
 * @param {any} [options.plugin] Plugin instance returned by payloadSelfStorage()
 * @returns {(req: Request, context?: { params: Promise<{ path?: string[] }> | { path?: string[] } }) => Promise<Response>}
 */
export function createMediaRouteHandler(options = {}) {
	return async function GET(req, context) {
		let backend = options.backend
		let rootDir = options.rootDir

		if (options.plugin) {
			if (!backend && options.plugin.backend) backend = options.plugin.backend
			if (!rootDir && options.plugin.rootDir) rootDir = options.plugin.rootDir
		}

		if (!backend && rootDir) {
			const { createLocalFilesystemBackend } = await import('../storage/local-backend.js')
			backend = createLocalFilesystemBackend({
				rootDir,
				publicUrlPrefix: options.publicUrlPrefix || '/media',
				thumbnailsDir: options.thumbnailsDir,
			})
		}

		if (!backend || !rootDir) {
			return new Response('Media Route Handler: backend or rootDir not configured', { status: 500 })
		}

		const url = req.url || ''
		return serveStorageFile(backend, rootDir, url, {
			thumbnailsDir: options.thumbnailsDir,
			thumbnailFormats: options.thumbnailFormats,
			mimeTypes: options.mimeTypes,
			cacheControl: options.cacheControl,
		})
	}
}
