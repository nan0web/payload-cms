/**
 * Asynchronously loads the vocabulary for a requested locale.
 * Falls back to 'en' loader if locale is not explicitly registered.
 *
 * @param {string} [locale='uk']
 * @returns {Promise<Record<string, string>>}
 */
export function loadVocabulary(locale?: string): Promise<Record<string, string>>;
/**
 * Creates a translation function configured with lazy-loaded vocabulary and custom overrides.
 *
 * @param {string} [locale='uk']
 * @param {Record<string, Record<string, string>>} [customTranslations={}]
 * @returns {Promise<(key: string, vars?: Record<string, any>) => string>}
 */
export function getTranslator(locale?: string, customTranslations?: Record<string, Record<string, string>>): Promise<(key: string, vars?: Record<string, any>) => string>;
/**
 * Synchronously creates a translator from an in-memory vocabulary dictionary.
 *
 * @param {Record<string, string>} [vocab={}]
 * @param {string} [locale='uk']
 * @param {Record<string, Record<string, string>>} [customTranslations={}]
 * @returns {(key: string, vars?: Record<string, any>) => string}
 */
export function createSyncTranslator(vocab?: Record<string, string>, locale?: string, customTranslations?: Record<string, Record<string, string>>): (key: string, vars?: Record<string, any>) => string;
