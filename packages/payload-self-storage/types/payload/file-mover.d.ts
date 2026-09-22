/**
 * Returns all file entries (original and sizes) from a Payload document.
 * @param {any} doc
 * @returns {Array<{ key: string, file: any }>}
 */
export function fileEntries(doc: any): Array<{
    key: string;
    file: any;
}>;
/**
 * Strips duplicate suffixes like -1, -2 appended by collision handlers,
 * taking care not to strip dimensions like -300x225.
 * @param {string} basename
 * @returns {string}
 */
export function stripDuplicateSuffix(basename: string): string;
/**
 * Cleans alt text fallback from a filename.
 * @param {string} filename
 * @returns {string}
 */
export function cleanAltFromFilename(filename: string): string;
/**
 * Computes updated file metadata with canonical URL and extension formatting.
 *
 * @param {any} file
 * @param {string} url
 * @param {string} [publicUrlPrefix]
 * @param {string} [customBasename]
 * @param {boolean} [convertToWebp=true]
 * @returns {any}
 */
export function computeFileMetadata(file: any, url: string, publicUrlPrefix?: string, customBasename?: string, convertToWebp?: boolean): any;
/**
 * Moves document files to their canonical physical folder paths and deduplicates.
 *
 * @param {Object} params
 * @param {any} params.backend
 * @param {any} params.doc
 * @param {any} params.req
 * @param {string} [params.publicUrlPrefix]
 * @param {string} [params.rootDir]
 * @param {boolean} [params.convertToWebp=true]
 * @returns {Promise<any>}
 */
export function moveDocumentFiles({ backend, doc, req, publicUrlPrefix, convertToWebp, }: {
    backend: any;
    doc: any;
    req: any;
    publicUrlPrefix?: string | undefined;
    rootDir?: string | undefined;
    convertToWebp?: boolean | undefined;
}): Promise<any>;
