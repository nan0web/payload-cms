import fs from 'node:fs/promises'
import path from 'node:path'
import { getTranslator } from '../i18n.js'
import { SelfManualConfigModel } from '../SelfManualConfigModel.js'
import { renderMarkdown } from './markdown-renderer.js'

const LOCALE_PATTERN = /^[a-z]{2}(?:-[A-Z]{2})?$/
const SLUG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_/-]*$/

/** Safely resolves docs/{locale}/payload/{slug}.md or docs/{locale}/README.md. */
export function resolveDocPath(docsDir, locale, slug) {
	if (typeof locale !== 'string' || !LOCALE_PATTERN.test(locale)) return null
	if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug) || slug.includes('..'))
		return null
	const root = path.resolve(docsDir)

	let resolved
	if (slug === 'index' || slug === 'readme' || slug === '') {
		resolved = path.resolve(root, locale, 'README.md')
	} else {
		resolved = path.resolve(root, locale, 'payload', `${slug}.md`)
	}

	return resolved === root || resolved.startsWith(`${root}${path.sep}`)
		? resolved
		: null
}

/** Scans available docs for the given locale with robust fallback to default locales across multiple sources. */
export async function scanDocumentationIndex(
	docsDir,
	locale = 'uk',
	availableLocales = [],
	docSources = [],
	translations = {}
) {
	const indexMap = new Map()
	const fallbackLocales = ['uk', 'en', 'ru']
	const candidateLocales = [
		...new Set([locale, ...availableLocales, ...fallbackLocales]),
	]
	const t = await getTranslator(locale, translations)

	const sources = [
		{ id: 'base', docsDir },
		...(Array.isArray(docSources) ? docSources : []),
	].filter((s) => s?.docsDir)

	for (const source of sources) {
		for (const loc of candidateLocales) {
			const targetDir = path.resolve(source.docsDir, loc, 'payload')
			try {
				const files = await fs.readdir(targetDir)
				for (const file of files) {
					if (file.endsWith('.md')) {
						const slug = file.replace(/\.md$/, '')
						if (!indexMap.has(slug)) {
							const raw = await fs
								.readFile(path.join(targetDir, file), 'utf8')
								.catch(() => '')
							const firstLine = raw.split('\n').find((l) => l.startsWith('# '))
							const title = firstLine ? firstLine.replace(/^#\s+/, '') : slug
							const searchText = raw.slice(0, 5000).toLowerCase()
							indexMap.set(slug, { slug, title, searchText })
						}
					}
				}
			} catch {}
		}
	}

	if (!indexMap.has('dashboard')) {
		indexMap.set('dashboard', {
			slug: 'dashboard',
			title: t(SelfManualConfigModel.UI.dashboardTitle),
			searchText: 'dashboard general overview',
		})
	}
	if (!indexMap.has('collections/media')) {
		indexMap.set('collections/media', {
			slug: 'collections/media',
			title: t(SelfManualConfigModel.UI.mediaTitle),
			searchText: 'media collection storage upload images videos',
		})
	}

	return Array.from(indexMap.values())
}

/** Loads a document with locale cascading and fallback across multiple registered documentation sources. */
export async function loadDocumentation({
	docsDir,
	locale,
	defaultLocale = 'uk',
	slug,
	availableLocales = [],
	docSources = [],
	translations = {},
}) {
	const cleanSlug = slug || 'dashboard'
	const activeLocale = locale || defaultLocale
	const t = await getTranslator(activeLocale, translations)
	const fallbackLocales = ['uk', 'en', 'ru']
	const locales = [
		...new Set(
			[locale, defaultLocale, ...availableLocales, ...fallbackLocales].filter(
				Boolean
			)
		),
	]

	const extraSources = Array.isArray(docSources) ? docSources : []
	const hasBaseInDocSources = extraSources.some(
		(s) => s?.docsDir && path.resolve(s.docsDir) === path.resolve(docsDir || '')
	)
	const sources = [
		...(hasBaseInDocSources
			? []
			: [
					{
						id: 'base',
						source: 'base',
						title: t(SelfManualConfigModel.UI.defaultGuideTitle),
						docsDir,
					},
				]),
		...extraSources,
	].filter((s) => s?.docsDir)

	const sections = []

	for (const source of sources) {
		for (const candidate of locales) {
			const filePath = resolveDocPath(source.docsDir, candidate, cleanSlug)
			if (filePath) {
				try {
					const markdown = await fs.readFile(filePath, 'utf8')
					const firstLine = markdown.split('\n').find((l) => l.startsWith('# '))
					const title = firstLine
						? firstLine.replace(/^#\s+/, '')
						: source.title || source.source || cleanSlug
					sections.push({
						id: source.id || source.source || 'section',
						source: source.source || source.id || 'system',
						title,
						locale: candidate,
						markdown,
						html: renderMarkdown(markdown),
					})
					break
				} catch {}
			}

			const directPath = path.resolve(
				source.docsDir,
				candidate,
				`${cleanSlug}.md`
			)
			try {
				const markdown = await fs.readFile(directPath, 'utf8')
				const firstLine = markdown.split('\n').find((l) => l.startsWith('# '))
				const title = firstLine
					? firstLine.replace(/^#\s+/, '')
					: source.title || source.source || cleanSlug
				sections.push({
					id: source.id || source.source || 'section',
					source: source.source || source.id || 'system',
					title,
					locale: candidate,
					markdown,
					html: renderMarkdown(markdown),
				})
				break
			} catch {}
		}
	}

	if (sections.length > 0) {
		return {
			found: true,
			locale: sections[0].locale,
			slug: cleanSlug,
			markdown: sections[0].markdown,
			sections,
		}
	}

	const fallbackTitle = t(SelfManualConfigModel.UI.docNotAvailableTitle)
	const fallbackMessage = t(SelfManualConfigModel.UI.docNotAvailableMessage, {
		slug: cleanSlug,
	})
	const fallbackMarkdown = `# ${fallbackTitle}\n\n${fallbackMessage}`
	return {
		found: false,
		locale: activeLocale,
		slug: cleanSlug,
		markdown: fallbackMarkdown,
		sections: [],
	}
}
