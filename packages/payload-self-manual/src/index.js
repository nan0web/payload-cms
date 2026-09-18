import fs from 'node:fs/promises'
import path from 'node:path'
import MarkdownIt from 'markdown-it'
import { getTranslator, loadVocabulary } from './i18n.js'
import { SelfManualConfigModel } from './SelfManualConfigModel.js'

export { getTranslator, loadVocabulary, SelfManualConfigModel }


const LOCALE_PATTERN = /^[a-z]{2}(?:-[A-Z]{2})?$/
const SLUG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_/-]*$/

/** Safely resolves docs/{locale}/payload/{slug}.md or docs/{locale}/README.md. */
export function resolveDocPath(docsDir, locale, slug) {
  if (typeof locale !== 'string' || !LOCALE_PATTERN.test(locale)) return null
  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug) || slug.includes('..')) return null
  const root = path.resolve(docsDir)
  
  let resolved
  if (slug === 'index' || slug === 'readme' || slug === '') {
    resolved = path.resolve(root, locale, 'README.md')
  } else {
    resolved = path.resolve(root, locale, 'payload', `${slug}.md`)
  }

  return resolved === root || resolved.startsWith(`${root}${path.sep}`) ? resolved : null
}

/** Scans available docs for the given locale with robust fallback to default locales across multiple sources. */
export async function scanDocumentationIndex(docsDir, locale = 'uk', availableLocales = [], docSources = [], translations = {}) {
  const indexMap = new Map()
  const fallbackLocales = ['uk', 'en', 'ru']
  const candidateLocales = [...new Set([locale, ...availableLocales, ...fallbackLocales])]
  const t = await getTranslator(locale, translations)

  const sources = [
    { id: 'base', docsDir },
    ...(Array.isArray(docSources) ? docSources : []),
  ].filter(s => s?.docsDir)

  for (const source of sources) {
    for (const loc of candidateLocales) {
      const targetDir = path.resolve(source.docsDir, loc, 'payload')
      try {
        const files = await fs.readdir(targetDir)
        for (const file of files) {
          if (file.endsWith('.md')) {
            const slug = file.replace(/\.md$/, '')
            if (!indexMap.has(slug)) {
              const raw = await fs.readFile(path.join(targetDir, file), 'utf8').catch(() => '')
              const firstLine = raw.split('\n').find((l) => l.startsWith('# '))
              const title = firstLine ? firstLine.replace(/^#\s+/, '') : slug
              // Store full text for search (first 5000 chars to avoid memory issues)
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
export async function loadDocumentation({ docsDir, locale, defaultLocale = 'uk', slug, availableLocales = [], docSources = [], translations = {} }) {
  const cleanSlug = slug || 'dashboard'
  const activeLocale = locale || defaultLocale
  const t = await getTranslator(activeLocale, translations)
  const fallbackLocales = ['uk', 'en', 'ru']
  const locales = [...new Set([locale, defaultLocale, ...availableLocales, ...fallbackLocales].filter(Boolean))]

  const extraSources = Array.isArray(docSources) ? docSources : []
  const hasBaseInDocSources = extraSources.some(s => s?.docsDir && path.resolve(s.docsDir) === path.resolve(docsDir || ''))
  const sources = [
    ...(hasBaseInDocSources ? [] : [{ id: 'base', source: 'base', title: t(SelfManualConfigModel.UI.defaultGuideTitle), docsDir }]),
    ...extraSources,
  ].filter(s => s?.docsDir)


  const sections = []

  for (const source of sources) {
    for (const candidate of locales) {
      // 1. Try resolveDocPath
      const filePath = resolveDocPath(source.docsDir, candidate, cleanSlug)
      if (filePath) {
        try {
          const markdown = await fs.readFile(filePath, 'utf8')
          const firstLine = markdown.split('\n').find((l) => l.startsWith('# '))
          const title = firstLine ? firstLine.replace(/^#\s+/, '') : (source.title || source.source || cleanSlug)
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
      // 2. Try direct relative path
      const directPath = path.resolve(source.docsDir, candidate, `${cleanSlug}.md`)
      try {
        const markdown = await fs.readFile(directPath, 'utf8')
        const firstLine = markdown.split('\n').find((l) => l.startsWith('# '))
        const title = firstLine ? firstLine.replace(/^#\s+/, '') : (source.title || source.source || cleanSlug)
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

  // Fallback localized content if document file is not found
  const fallbackTitle = t(SelfManualConfigModel.UI.docNotAvailableTitle)
  const fallbackMessage = t(
    SelfManualConfigModel.UI.docNotAvailableMessage,
    { slug: cleanSlug }
  )
  const fallbackMarkdown = `# ${fallbackTitle}\n\n${fallbackMessage}`
  return {
    found: false,
    locale: activeLocale,
    slug: cleanSlug,
    markdown: fallbackMarkdown,
    sections: [],
  }
}



export function isMermaidFence(language) {
  return typeof language === 'string' && language.trim().toLowerCase() === 'mermaid'
}

const markdownRenderer = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true,
})

markdownRenderer.renderer.rules.fence = (tokens, index, options, env, self) => {
  const token = tokens[index]
  const language = token.info.trim().split(/\s+/, 1)[0]
  if (isMermaidFence(language)) {
    return `<div class="self-manual-mermaid" data-mermaid="${escapeHtml(token.content.trim())}"></div>`
  }
  const className = language ? ` class="language-${escapeHtml(language)}"` : ''
  return `<pre><code${className}>${escapeHtml(token.content)}</code></pre>\n`
}

export function renderMarkdown(markdown) {
  return markdownRenderer.render(String(markdown || ''))
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
}

/**
 * Inspects active plugins and system configuration from Payload config.
 *
 * @param {Object} config Payload configuration object
 * @returns {{ plugins: Array<{ id: string, name: string, title: string, version?: string, status: string, hasDocs: boolean, docsDir?: string, options?: any }> }}
 */
export function inspectPlugins(config = {}) {
  const pluginsMap = new Map()

  // 1. Check selfManual plugin registration in admin.custom
  const selfManualCustom = config.admin?.custom?.selfManual
  if (selfManualCustom?.enabled) {
    pluginsMap.set('self-manual', {
      id: 'self-manual',
      name: '@nan0web/payload-self-manual',
      title: 'Self Manual',
      version: selfManualCustom.version || '0.1.0',
      status: 'active',
      hasDocs: Boolean(selfManualCustom.docsDir),
      docsDir: selfManualCustom.docsDir || 'docs',
      options: {
        defaultLocale: selfManualCustom.defaultLocale,
        multiDocView: selfManualCustom.ui?.multiDocView,
        releaseNotifications: selfManualCustom.releaseNotifications,
      },
    })
  }

  // 2. Check registered doc sources in custom.selfManualDocs
  const customDocs = Array.isArray(config.custom?.selfManualDocs) ? config.custom.selfManualDocs : []
  for (const docSource of customDocs) {
    if (!docSource) continue
    const id = docSource.id || docSource.source || 'custom-plugin'
    const name = docSource.source || docSource.id || id
    const existing = pluginsMap.get(id) || {}
    pluginsMap.set(id, {
      id,
      name,
      title: docSource.title || name,
      version: docSource.version || existing.version || '0.1.0',
      status: 'active',
      hasDocs: Boolean(docSource.docsDir),
      docsDir: docSource.docsDir,
      options: docSource.options || existing.options,
    })
  }

  // 3. Check admin.custom for registered plugin metadata
  const adminCustom = config.admin?.custom || {}
  if (adminCustom.browseByFolder?.enabled && !pluginsMap.has('browse-by-folder')) {
    pluginsMap.set('browse-by-folder', {
      id: 'browse-by-folder',
      name: '@nan0web/payload-browse-by-folder',
      title: 'Browse by Folder',
      version: '0.1.0',
      status: 'active',
      hasDocs: true,
      docsDir: 'docs',
      options: adminCustom.browseByFolder,
    })
  }
  if (adminCustom.keyboardFocus?.enabled && !pluginsMap.has('keyboard-accessibility')) {
    pluginsMap.set('keyboard-accessibility', {
      id: 'keyboard-accessibility',
      name: '@nan0web/payloadcms-keyboard-accessibility',
      title: 'Keyboard Accessibility',
      version: '0.1.0',
      status: 'active',
      hasDocs: true,
      docsDir: 'docs',
      options: adminCustom.keyboardFocus.options,
    })
  }
  if (adminCustom.signinThemeState?.enabled && !pluginsMap.has('signin-theme-state')) {
    pluginsMap.set('signin-theme-state', {
      id: 'signin-theme-state',
      name: '@nan0web/payload-signin-theme-state',
      title: 'Signin Theme State',
      version: '0.1.0',
      status: 'active',
      hasDocs: true,
      docsDir: 'docs',
      options: adminCustom.signinThemeState,
    })
  }

  // Check collections for custom plugin registrations (e.g. browseByFolder)
  if (Array.isArray(config.collections)) {
    for (const col of config.collections) {
      if (col.admin?.custom?.browseByFolder?.enabled && !pluginsMap.has('browse-by-folder')) {
        pluginsMap.set('browse-by-folder', {
          id: 'browse-by-folder',
          name: '@nan0web/payload-browse-by-folder',
          title: 'Browse by Folder',
          version: '0.1.0',
          status: 'active',
          hasDocs: true,
          docsDir: 'docs',
          options: col.admin.custom.browseByFolder,
        })
      }
    }
  }

  // 4. Check plugins array in config.plugins
  if (Array.isArray(config.plugins)) {
    for (let i = 0; i < config.plugins.length; i++) {
      const plugin = config.plugins[i]
      if (typeof plugin === 'function' && plugin.name) {
        const id = plugin.name
        if (!pluginsMap.has(id)) {
          pluginsMap.set(id, {
            id,
            name: plugin.name,
            title: plugin.name,
            status: 'active',
            hasDocs: false,
          })
        }
      }
    }
  }

  // Fallback if none detected but plugin is running
  if (pluginsMap.size === 0) {
    pluginsMap.set('self-manual', {
      id: 'self-manual',
      name: '@nan0web/payload-self-manual',
      title: 'Self Manual',
      version: '0.1.0',
      status: 'active',
      hasDocs: true,
      docsDir: 'docs',
    })
  }

  return {
    plugins: Array.from(pluginsMap.values()),
  }
}

/** Creates the server-only Payload endpoint used by the Admin component. */
export function createDocumentationEndpoint({ docsDir, defaultLocale, availableLocales = [], getDocSources = () => [], getConfig, translations = {} }) {
  return async (input) => {
    const req = input?.req || input
    const url = new URL(req?.url || 'http://payload.local', 'http://payload.local')
    const locale = url.searchParams.get('locale') || defaultLocale
    const slug = url.searchParams.get('slug') || 'dashboard'
    const info = url.searchParams.get('info')
    const docSources = typeof getDocSources === 'function' ? getDocSources() : (Array.isArray(getDocSources) ? getDocSources : [])

    const resolvedConfig = typeof getConfig === 'function' ? getConfig() : (getConfig || {})
    const system = inspectPlugins(resolvedConfig)

    // If requesting system info
    if (info === 'system') {
      return Response.json({
        system,
        locale,
      }, { status: 200 })
    }

    const [result, index] = await Promise.all([
      loadDocumentation({ docsDir, defaultLocale, locale, slug, availableLocales, docSources, translations }),
      scanDocumentationIndex(docsDir, locale, availableLocales, docSources, translations),
    ])

    return Response.json({
      ...result,
      system,
      index,
      html: renderMarkdown(result.markdown),
      markdown: undefined,
    }, { status: 200 })
  }
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
    // Extract available locales from Payload config
    const availableLocales = config.locales?.map(locale => locale.code) || []
    const packageDocsDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../docs')

    const getDocSources = () => {
      const customDocs = config.custom?.selfManualDocs || []
      const list = Array.isArray(customDocs) ? [...customDocs] : []
      if (!list.some((d) => d?.id === 'self-manual' || d?.source === '@nan0web/payload-self-manual')) {
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
            ...(ui.headerHelpButton ? [{ path: '@nan0web/payload-self-manual/admin#SelfManualHelp', clientProps: { docsDir, defaultLocale, availableLocales, ui, translations } }] : []),
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


