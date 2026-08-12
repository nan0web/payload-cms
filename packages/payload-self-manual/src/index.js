import fs from 'node:fs/promises'
import path from 'node:path'
import MarkdownIt from 'markdown-it'

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

/** Scans available docs for the given locale with robust fallback to default locales. */
export async function scanDocumentationIndex(docsDir, locale = 'uk', availableLocales = []) {
  const indexMap = new Map()
  const fallbackLocales = ['uk', 'en', 'ru']
  const candidateLocales = [...new Set([locale, ...availableLocales, ...fallbackLocales])]

  for (const loc of candidateLocales) {
    const targetDir = path.resolve(docsDir, loc, 'payload')
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

  if (!indexMap.has('dashboard')) indexMap.set('dashboard', { slug: 'dashboard', title: 'Dashboard & General', searchText: 'dashboard general overview' })
  if (!indexMap.has('collections/media')) indexMap.set('collections/media', { slug: 'collections/media', title: 'Media Collection & Storage', searchText: 'media collection storage upload images videos' })

  return Array.from(indexMap.values())
}

/** Loads a document with locale cascading and fallback. */
export async function loadDocumentation({ docsDir, locale, defaultLocale = 'uk', slug, availableLocales = [] }) {
  const cleanSlug = slug || 'dashboard'
  const fallbackLocales = ['uk', 'en', 'ru']
  const locales = [...new Set([locale, defaultLocale, ...availableLocales, ...fallbackLocales].filter(Boolean))]
  
  for (const candidate of locales) {
    // 1. Try resolveDocPath
    const filePath = resolveDocPath(docsDir, candidate, cleanSlug)
    if (filePath) {
      try {
        const markdown = await fs.readFile(filePath, 'utf8')
        return { found: true, locale: candidate, slug: cleanSlug, markdown }
      } catch {}
    }
    // 2. Try direct relative path
    const directPath = path.resolve(docsDir, candidate, `${cleanSlug}.md`)
    try {
      const markdown = await fs.readFile(directPath, 'utf8')
      return { found: true, locale: candidate, slug: cleanSlug, markdown }
    } catch {}
  }

  // Fallback demo content if document file is not found
  const fallbackTitles = {
    en: 'Documentation Not Available',
    uk: 'Документацію не знайдено',
    ru: 'Документация недоступна'
  }
  const fallbackMessages = {
    en: `No documentation is currently available for **${cleanSlug}**.\n\nPlease select another guide from the sidebar.\n\n- Quick shortcut: Press \`⌘/\` or \`Ctrl+/\` anytime to toggle help.`,
    uk: `Наразі документацію для **${cleanSlug}** не знайдено.\n\nБудь ласка, оберіть інший гід з бічного меню.\n\n- Швидкий доступ: Натисніть \`⌘/\` або \`Ctrl+/\` для перемикання довідки.`,
    ru: `В настоящее время документация для **${cleanSlug}** недоступна.\n\nПожалуйста, выберите другой гид из бокового меню.\n\n- Быстрый доступ: Нажмите \`⌘/\` или \`Ctrl+/\`, чтобы переключить справку.`
  }
  const fallbackTitle = fallbackTitles[defaultLocale] || fallbackTitles[locale] || fallbackTitles.en
  const fallbackMessage = fallbackMessages[defaultLocale] || fallbackMessages[locale] || fallbackMessages.en
  const fallbackMarkdown = `# ${fallbackTitle}\n\n${fallbackMessage}`
  return { found: false, locale: defaultLocale, slug: cleanSlug, markdown: fallbackMarkdown }
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

/** Creates the server-only Payload endpoint used by the Admin component. */
export function createDocumentationEndpoint({ docsDir, defaultLocale, availableLocales = [] }) {
  return async (input) => {
    const req = input?.req || input
    const url = new URL(req?.url || 'http://payload.local', 'http://payload.local')
    const locale = url.searchParams.get('locale') || defaultLocale
    const slug = url.searchParams.get('slug') || 'dashboard'

    const [result, index] = await Promise.all([
      loadDocumentation({ docsDir, defaultLocale, locale, slug, availableLocales }),
      scanDocumentationIndex(docsDir, locale, availableLocales),
    ])

    return Response.json({
      ...result,
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
  const docsDir = options.docsDir || 'docs'
  const defaultLocale = options.defaultLocale || 'uk'

  const ui = {
    sidebarMenu: options.ui?.sidebarMenu !== false,
    headerHelpButton: options.ui?.headerHelpButton !== false,
    settingsTab: Boolean(options.ui?.settingsTab),
  }

  const releaseNotifications = options.releaseNotifications || 'full_tutorial'

  return (config) => {
    // Extract available locales from Payload config
    const availableLocales = config.locales?.map(locale => locale.code) || []

    return {
      ...config,
      endpoints: [
        ...(Array.isArray(config.endpoints) ? config.endpoints : []),
        { path: '/_self-manual', method: 'get', handler: createDocumentationEndpoint({ docsDir, defaultLocale, availableLocales }) },
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
            ...(ui.headerHelpButton ? [{ path: '@nan0web/payload-self-manual/admin', clientProps: { docsDir, defaultLocale, availableLocales } }] : []),
          ],
        },
        custom: {
          ...config.admin?.custom,
          selfManual: {
            enabled: true,
            docsDir,
            defaultLocale,
            availableLocales,
            ui,
            releaseNotifications,
          },
        },
      },
    }
  }
}
