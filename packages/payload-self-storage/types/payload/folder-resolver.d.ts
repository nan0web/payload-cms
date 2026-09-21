/**
 * Extracts folder ID if folder is an object or primitive.
 * @param {any} folder
 * @returns {string|number|null|undefined}
 */
export function folderId(folder: any): string | number | null | undefined;
/**
 * Recursively resolves the physical folder path from a Payload folder entity or ID.
 * Supports Payload 3.x folder structure (slug or name) and searches req.payload.findByID if ID given.
 *
 * @param {any} folder - Folder ID, folder object or nested folder reference
 * @param {any} [req] - Payload request object with access to payload.findByID
 * @returns {Promise<string>} Resolved folder path without leading/trailing slashes (e.g. 'screenshots/recent')
 */
export function resolveFolderPath(folder: any, req?: any): Promise<string>;
/**
 * Resolves target folder path from document and request context.
 * Checks doc.sourcePath first, then doc.folder, req.data.folder, req.body.folder.
 *
 * @param {Object} params
 * @param {any} params.doc
 * @param {any} params.req
 * @returns {Promise<{ folderPath: string, customBasename: string, customExt: string }>}
 */
export function resolveTargetFolder({ doc, req }: {
    doc: any;
    req: any;
}): Promise<{
    folderPath: string;
    customBasename: string;
    customExt: string;
}>;
