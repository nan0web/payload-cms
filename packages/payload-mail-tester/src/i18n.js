import { createT } from '@nan0web/types'

const localeLoaders = {
  en: () => import('./locales/en.js').then((m) => m.default || m),
  uk: () => import('./locales/uk.js').then((m) => m.default || m),
}

const vocabCache = new Map()

/**
 * Asynchronously loads vocabulary for locale.
 * @param {string} [locale='uk']
 * @returns {Promise<Record<string, string>>}
 */
export async function loadVocabulary(locale = 'uk') {
  const norm = String(locale || '').toLowerCase().slice(0, 2) || 'uk'
  if (vocabCache.has(norm)) {
    return vocabCache.get(norm)
  }

  const loader = localeLoaders[norm] || localeLoaders.en
  try {
    const vocab = await loader()
    vocabCache.set(norm, vocab)
    return vocab
  } catch {
    return {}
  }
}

/**
 * Creates an async translation function.
 * @param {string} [locale='uk']
 * @param {Record<string, Record<string, string>>} [customTranslations={}]
 * @returns {Promise<(key: string, vars?: Record<string, any>) => string>}
 */
export async function getTranslator(locale = 'uk', customTranslations = {}) {
  const norm = String(locale || '').toLowerCase().slice(0, 2) || 'uk'
  const vocab = await loadVocabulary(norm)
  const custom = customTranslations[norm] || {}
  const merged = { ...vocab, ...custom }
  return createT(merged, norm)
}

/**
 * Synchronously creates a fallback translation function.
 * @param {Record<string, string>} [vocab={}]
 * @param {string} [locale='uk']
 * @param {Record<string, Record<string, string>>} [customTranslations={}]
 * @returns {(key: string, vars?: Record<string, any>) => string}
 */
export function createSyncTranslator(vocab = {}, locale = 'uk', customTranslations = {}) {
  const norm = String(locale || '').toLowerCase().slice(0, 2) || 'uk'
  const custom = customTranslations[norm] || {}
  const merged = { ...vocab, ...custom }
  return createT(merged, norm)
}
