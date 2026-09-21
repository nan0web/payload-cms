/**
 * Recursively search a directory for a given filename.
 * @param {string} dir
 * @param {string} targetBasename
 * @returns {Promise<string|null>}
 */
export function findRecursive(dir: string, targetBasename: string): Promise<string | null>;
/**
 * Generates resized image thumbnail on demand using Sharp if available.
 *
 * @param {string} rootDir
 * @param {string} filename
 * @param {Object} [options]
 * @param {string[]} [options.thumbnailFormats]
 * @returns {Promise<string|null>}
 */
export function generateThumbnailOnDemand(rootDir: string, filename: string, { thumbnailFormats }?: {
    thumbnailFormats?: string[] | undefined;
}): Promise<string | null>;
/**
 * Returns an HTTP response streaming the requested file with caching headers.
 * @param {string} filePath
 * @param {Object} [options]
 * @param {Record<string, string>} [options.mimeTypes]
 * @param {string} [options.cacheControl]
 * @returns {() => Promise<Response>}
 */
export function respondWithFile(filePath: string, { mimeTypes, cacheControl }?: {
    mimeTypes?: Record<string, string> | undefined;
    cacheControl?: string | undefined;
}): () => Promise<Response>;
/**
 * Creates custom upload handler for on-demand file serving during GET requests.
 * Compatible with Payload's Collection `upload.handlers` specification.
 *
 * @see {@link import('payload').UploadConfig['handlers']}
 *
 * @param {Object} options
 * @param {any} options.policy
 * @param {string} options.rootDir
 * @param {Record<string, string>} [options.mimeTypes]
 * @param {string} [options.cacheControl]
 * @returns {(req: import('payload').PayloadRequest, context: { doc: import('payload').TypeWithID, params: { filename?: string, collection?: string, prefix?: string } }) => Promise<Response|null>}
 */
export function createUploadHandler({ policy, rootDir, mimeTypes, cacheControl }: {
    policy: any;
    rootDir: string;
    mimeTypes?: Record<string, string> | undefined;
    cacheControl?: string | undefined;
}): (req: import("payload").PayloadRequest, context: {
    doc: import("payload").TypeWithID;
    params: {
        filename?: string;
        collection?: string;
        prefix?: string;
    };
}) => Promise<Response | null>;
/**
 * Direct file server helper for custom storage routes.
 *
 * @param {any} backend
 * @param {string} rootDir
 * @param {string} reqUrl
 * @param {Object} [options]
 * @param {Record<string, string>} [options.mimeTypes]
 * @param {string} [options.cacheControl]
 * @param {string[]} [options.thumbnailFormats]
 * @returns {Promise<Response>}
 */
export function serveStorageFile(backend: any, rootDir: string, reqUrl: string, { mimeTypes, cacheControl, thumbnailFormats, }?: {
    mimeTypes?: Record<string, string> | undefined;
    cacheControl?: string | undefined;
    thumbnailFormats?: string[] | undefined;
}): Promise<Response>;
/** @type {Record<string, string>} */
export const DEFAULT_MIME_TYPES: Record<string, string>;
export const DEFAULT_CACHE_CONTROL: "public, max-age=31536000, immutable";
export const DEFAULT_THUMBNAIL_FORMATS: string[];
