/** Safely resolves docs/{locale}/payload/{slug}.md or docs/{locale}/README.md. */
export function resolveDocPath(docsDir: any, locale: any, slug: any): string | null;
/** Scans available docs for the given locale with robust fallback to default locales across multiple sources. */
export function scanDocumentationIndex(docsDir: any, locale?: string, availableLocales?: any[], docSources?: any[], translations?: {}): Promise<any[]>;
/** Loads a document with locale cascading and fallback across multiple registered documentation sources. */
export function loadDocumentation({ docsDir, locale, defaultLocale, slug, availableLocales, docSources, translations }: {
    docsDir: any;
    locale: any;
    defaultLocale?: string | undefined;
    slug: any;
    availableLocales?: never[] | undefined;
    docSources?: never[] | undefined;
    translations?: {} | undefined;
}): Promise<{
    found: boolean;
    locale: any;
    slug: any;
    markdown: string;
    sections: {
        id: any;
        source: any;
        title: any;
        locale: any;
        markdown: string;
        html: any;
    }[];
}>;
export function isMermaidFence(language: any): boolean;
export function renderMarkdown(markdown: any): any;
/**
 * Inspects active plugins and system configuration from Payload config.
 *
 * @param {Object} config Payload configuration object
 * @returns {{ plugins: Array<{ id: string, name: string, title: string, version?: string, status: string, hasDocs: boolean, docsDir?: string, options?: any }> }}
 */
export function inspectPlugins(config?: any): {
    plugins: Array<{
        id: string;
        name: string;
        title: string;
        version?: string;
        status: string;
        hasDocs: boolean;
        docsDir?: string;
        options?: any;
    }>;
};
/** Creates the server-only Payload endpoint used by the Admin component. */
export function createDocumentationEndpoint({ docsDir, defaultLocale, availableLocales, getDocSources, getConfig, translations }: {
    docsDir: any;
    defaultLocale: any;
    availableLocales?: never[] | undefined;
    getDocSources?: (() => never[]) | undefined;
    getConfig: any;
    translations?: {} | undefined;
}): (input: any) => Promise<Response>;
/**
 * Configure payload-self-manual plugin with UI options and release notification controls
 */
export function payloadSelfManual(options?: {}): (config: any) => any;
import { getTranslator } from './i18n.js';
import { loadVocabulary } from './i18n.js';
import { SelfManualConfigModel } from './SelfManualConfigModel.js';
export { getTranslator, loadVocabulary, SelfManualConfigModel };
