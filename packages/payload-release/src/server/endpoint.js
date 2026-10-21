import path from 'node:path'
import { renderMarkdown } from './markdown.js'

/**
 * Creates endpoint handler for serving release files securely.
 *
 * @param {Object} options
 * @param {string} [options.releasesDir='releases']
 * @param {Function} [options.readReleaseFile]
 * @returns {(req: any) => Promise<Response>}
 */
export function createReleaseFileEndpoint(options = {}) {
	const { releasesDir = 'releases', readReleaseFile } = options

	return async (req) => {
		const url = new URL(req?.url || 'http://localhost', 'http://localhost')
		const relPath = url.searchParams.get('path') || ''

		// Safety check against directory traversal
		if (!relPath || relPath.includes('..') || path.isAbsolute(relPath)) {
			return Response.json(
				{ error: 'Invalid file path', found: false },
				{ status: 400 }
			)
		}

		try {
			let content = null
			if (typeof readReleaseFile === 'function') {
				content = await readReleaseFile(relPath)
			}

			if (content === null || content === undefined) {
				return Response.json(
					{ error: 'File not found', found: false },
					{ status: 404 }
				)
			}

			const raw = String(content)
			const html = renderMarkdown(raw)

			return Response.json(
				{
					path: relPath,
					raw,
					html,
					found: true,
				},
				{ status: 200 }
			)
		} catch (err) {
			return Response.json(
				{ error: /** @type {Error} */ (err).message, found: false },
				{ status: 500 }
			)
		}
	}
}
