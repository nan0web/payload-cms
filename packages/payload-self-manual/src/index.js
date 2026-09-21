import path from 'node:path'
import { getTranslator, loadVocabulary } from './i18n.js'
import { SelfManualConfigModel } from './SelfManualConfigModel.js'
import {
	renderMarkdown,
	isMermaidFence,
	escapeHtml,
} from './server/markdown-renderer.js'
import {
	resolveDocPath,
	scanDocumentationIndex,
	loadDocumentation,
} from './server/doc-loader.js'
import { inspectPlugins } from './server/plugins-inspector.js'
import { createDocumentationEndpoint } from './server/endpoint.js'

export {
	getTranslator,
	loadVocabulary,
	SelfManualConfigModel,
	renderMarkdown,
	isMermaidFence,
	escapeHtml,
	resolveDocPath,
	scanDocumentationIndex,
	loadDocumentation,
	inspectPlugins,
	createDocumentationEndpoint,
}

/**
 * Configure payload-self-manual plugin with UI options and release notification controls
 */
export function payloadSelfManual(options = {}) {
	const model = new SelfManualConfigModel(options)
	model.validate()

	const { docsDir, defaultLocale, translations, releaseNotifications } = model
	const ui = {
		sidebarMenu: options.ui?.sidebarMenu !== false,
		headerHelpButton: options.ui?.headerHelpButton !== false,
		settingsTab: Boolean(options.ui?.settingsTab),
		multiDocView: options.ui?.multiDocView || model.multiDocView || 'tabs',
	}

	return (config) => {
		const availableLocales =
			config.locales?.map((locale) => locale.code) || []
		const packageDocsDir = path.resolve(
			path.dirname(new URL(import.meta.url).pathname),
			'../docs'
		)

		const getDocSources = () => {
			const customDocs = config.custom?.selfManualDocs || []
			const list = Array.isArray(customDocs) ? [...customDocs] : []
			if (
				!list.some(
					(d) =>
						d?.id === 'self-manual' ||
						d?.source === '@nan0web/payload-self-manual'
				)
			) {
				list.push({
					id: 'self-manual',
					source: '@nan0web/payload-self-manual',
					title: 'Self Manual',
					docsDir: packageDocsDir,
				})
			}
			return list
		}

		const payloadManualConfig = {
			enabled: true,
			version: '0.1.0',
			docsDir,
			packageDocsDir,
			defaultLocale,
			availableLocales,
			ui,
			releaseNotifications,
			translations,
		}

		const endpointHandler = createDocumentationEndpoint({
			docsDir,
			defaultLocale,
			availableLocales,
			getDocSources,
			getConfig: () => ({
				...config,
				admin: {
					...config.admin,
					custom: {
						...config.admin?.custom,
						selfManual: payloadManualConfig,
					},
				},
			}),
			translations,
		})

		return {
			...config,
			endpoints: [
				...(Array.isArray(config.endpoints) ? config.endpoints : []),
				{ path: '/_self-manual', method: 'get', handler: endpointHandler },
			],
			admin: {
				...config.admin,
				components: {
					...config.admin?.components,
					actions: [
						...(Array.isArray(config.admin?.components?.actions)
							? config.admin.components.actions
							: config.admin?.components?.actions
								? [config.admin.components.actions]
								: []),
						...(ui.headerHelpButton
							? [
									{
										path: '@nan0web/payload-self-manual/admin#SelfManualHelp',
										clientProps: {
											docsDir,
											defaultLocale,
											availableLocales,
											ui,
											translations,
										},
									},
								]
							: []),
					],
				},
				custom: {
					...config.admin?.custom,
					selfManual: payloadManualConfig,
				},
			},
		}
	}
}
