/**
 * Asynchronously loads vocabulary for locale.
 * @param {string} [locale='uk']
 * @returns {Promise<Record<string, string>>}
 */
export function loadVocabulary(locale?: string): Promise<Record<string, string>>;
/**
 * Creates an async translation function.
 * @param {string} [locale='uk']
 * @param {Record<string, Record<string, string>>} [customTranslations={}]
 * @returns {Promise<(key: string, vars?: Record<string, any>) => string>}
 */
export function getTranslator(locale?: string, customTranslations?: Record<string, Record<string, string>>): Promise<(key: string, vars?: Record<string, any>) => string>;
/**
 * Synchronously creates a fallback translation function.
 * @param {Record<string, string>} [vocab={}]
 * @param {string} [locale='uk']
 * @param {Record<string, Record<string, string>>} [customTranslations={}]
 * @returns {(key: string, vars?: Record<string, any>) => string}
 */
export function createSyncTranslator(vocab?: Record<string, string>, locale?: string, customTranslations?: Record<string, Record<string, string>>): (key: string, vars?: Record<string, any>) => string;
