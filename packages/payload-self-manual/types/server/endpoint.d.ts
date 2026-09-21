/** Creates the server-only Payload endpoint used by the Admin component. */
export function createDocumentationEndpoint({ docsDir, defaultLocale, availableLocales, getDocSources, getConfig, translations, }: {
    docsDir: any;
    defaultLocale: any;
    availableLocales?: never[] | undefined;
    getDocSources?: (() => never[]) | undefined;
    getConfig: any;
    translations?: {} | undefined;
}): (input: any) => Promise<Response>;
