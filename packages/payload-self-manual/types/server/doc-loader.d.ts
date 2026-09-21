/** Safely resolves docs/{locale}/payload/{slug}.md or docs/{locale}/README.md. */
export function resolveDocPath(docsDir: any, locale: any, slug: any): string | null;
/** Scans available docs for the given locale with robust fallback to default locales across multiple sources. */
export function scanDocumentationIndex(docsDir: any, locale?: string, availableLocales?: any[], docSources?: any[], translations?: {}): Promise<any[]>;
/** Loads a document with locale cascading and fallback across multiple registered documentation sources. */
export function loadDocumentation({ docsDir, locale, defaultLocale, slug, availableLocales, docSources, translations, }: {
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
        html: string;
    }[];
}>;
