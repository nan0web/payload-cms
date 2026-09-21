import { renderMarkdown } from './markdown-renderer.js'
import { loadDocumentation, scanDocumentationIndex } from './doc-loader.js'
import { inspectPlugins } from './plugins-inspector.js'

/** Creates the server-only Payload endpoint used by the Admin component. */
export function createDocumentationEndpoint({
	docsDir,
	defaultLocale,
	availableLocales = [],
	getDocSources = () => [],
	getConfig,
	translations = {},
}) {
	return async (input) => {
		const req = input?.req || input
		const url = new URL(
			req?.url || 'http://payload.local',
			'http://payload.local'
		)
		const locale = url.searchParams.get('locale') || defaultLocale
		const slug = url.searchParams.get('slug') || 'dashboard'
		const info = url.searchParams.get('info')
		const runtimeConfig = req?.payload?.config || {}
		const baseConfig =
			typeof getConfig === 'function'
				? getConfig()
				: getConfig || {}
		const resolvedConfig = {
			...baseConfig,
			...runtimeConfig,
			admin: {
				...(baseConfig.admin || {}),
				...(runtimeConfig.admin || {}),
				custom: {
					...(baseConfig.admin?.custom || {}),
					...(runtimeConfig.admin?.custom || {}),
				},
			},
			custom: {
				...(baseConfig.custom || {}),
				...(runtimeConfig.custom || {}),
			},
		}

		const staticDocSources =
			typeof getDocSources === 'function'
				? getDocSources()
				: Array.isArray(getDocSources)
					? getDocSources
					: []
		const runtimeDocSources = Array.isArray(runtimeConfig.custom?.selfManualDocs)
			? runtimeConfig.custom.selfManualDocs
			: []
		const docSourcesMap = new Map()
		for (const src of [...staticDocSources, ...runtimeDocSources]) {
			if (src?.id || src?.source) {
				docSourcesMap.set(src.id || src.source, src)
			}
		}
		const docSources = Array.from(docSourcesMap.values())

		const system = inspectPlugins(resolvedConfig)

		// If requesting system info
		if (info === 'system') {
			return Response.json(
				{
					system,
					locale,
				},
				{ status: 200 }
			)
		}

		const [result, index] = await Promise.all([
			loadDocumentation({
				docsDir,
				defaultLocale,
				locale,
				slug,
				availableLocales,
				docSources,
				translations,
			}),
			scanDocumentationIndex(
				docsDir,
				locale,
				availableLocales,
				docSources,
				translations
			),
		])

		return Response.json(
			{
				...result,
				system,
				index,
				html: renderMarkdown(result.markdown),
				markdown: undefined,
			},
			{ status: 200 }
		)
	}
}
