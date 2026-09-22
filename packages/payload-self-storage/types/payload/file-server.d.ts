/**
 * Recursively search a directory for a given filename.
 * @param {string} dir
 * @param {string} targetBasename
 * @returns {Promise<string|null>}
 */
export function findRecursive(dir: string, targetBasename: string): Promise<string | null>;
/**
 * Generates resized image thumbnail on demand using Sharp if available,
 * caching it in options.thumbnailsDir.
 *
 * @param {string} rootDir
 * @param {string} filename
 * @param {Object} [options]
 * @param {string} [options.thumbnailsDir]
 * @param {string[]} [options.thumbnailFormats]
 * @returns {Promise<string|null>}
 */
export function generateThumbnailOnDemand(rootDir: string, filename: string, { thumbnailsDir, thumbnailFormats }?: {
    thumbnailsDir?: string | undefined;
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
 * @returns {(req: import('payload').PayloadRequest, context: { doc: import('payload').TypeWithID & { url?: string, filename?: string, sizes?: Record<string, { url?: string, filename?: string }> }, params: { filename?: string, collection?: string, prefix?: string } }) => Promise<Response|null>}
 */
export function createUploadHandler({ policy, rootDir, mimeTypes, cacheControl, }: {
    policy: any;
    rootDir: string;
    mimeTypes?: Record<string, string> | undefined;
    cacheControl?: string | undefined;
}): (req: import("payload").PayloadRequest, context: {
    doc: import("payload").TypeWithID & {
        url?: string;
        filename?: string;
        sizes?: Record<string, {
            url?: string;
            filename?: string;
        }>;
    };
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
 * @param {string} [options.thumbnailsDir]
 * @param {string[]} [options.thumbnailFormats]
 * @returns {Promise<Response>}
 */
export function serveStorageFile(backend: any, rootDir: string, reqUrl: string, { mimeTypes, cacheControl, thumbnailsDir, thumbnailFormats, }?: {
    mimeTypes?: Record<string, string> | undefined;
    cacheControl?: string | undefined;
    thumbnailsDir?: string | undefined;
    thumbnailFormats?: string[] | undefined;
}): Promise<Response>;
/**
 * Copies generated thumbnails from thumbnailsDir into the static distribution directory.
 * Ensures thumbnails exist in static build outputs (out/ or public/) for static servers.
 *
 * @param {Object} options
 * @param {string} options.thumbnailsDir
 * @param {string} options.targetDir
 * @returns {Promise<{ copied: number }>}
 */
export function syncThumbnailsToStatic({ thumbnailsDir, targetDir }: {
    thumbnailsDir: string;
    targetDir: string;
}): Promise<{
    copied: number;
}>;
/**
 * Synchronizes entire storage (including generated thumbnails) into a static distribution directory (SSG).
 * Recursively copies all original media and cached thumbnails, preserving structure.
 *
 * @param {Object} options
 * @param {string} options.rootDir
 * @param {string} options.targetDir
 * @param {string} [options.thumbnailsDir]
 * @returns {Promise<{ copiedFiles: number }>}
 */
export function syncStorageToDist({ rootDir, targetDir, thumbnailsDir }: {
    rootDir: string;
    targetDir: string;
    thumbnailsDir?: string | undefined;
}): Promise<{
    copiedFiles: number;
}>;
/**
 * Creates a Next.js App Router Route Handler (GET) for serving media files directly.
 *
 * @param {Object} [options]
 * @param {any} [options.backend]
 * @param {string} [options.rootDir]
 * @param {string} [options.publicUrlPrefix]
 * @param {string} [options.thumbnailsDir]
 * @param {string[]} [options.thumbnailFormats]
 * @param {Record<string, string>} [options.mimeTypes]
 * @param {string} [options.cacheControl]
 * @param {any} [options.plugin] Plugin instance returned by payloadSelfStorage()
 * @returns {(req: Request, context?: { params: Promise<{ path?: string[] }> | { path?: string[] } }) => Promise<Response>}
 */
export function createMediaRouteHandler(options?: {
    backend?: any;
    rootDir?: string | undefined;
    publicUrlPrefix?: string | undefined;
    thumbnailsDir?: string | undefined;
    thumbnailFormats?: string[] | undefined;
    mimeTypes?: Record<string, string> | undefined;
    cacheControl?: string | undefined;
    plugin?: any;
}): (req: Request, context?: {
    params: Promise<{
        path?: string[];
    }> | {
        path?: string[];
    };
}) => Promise<Response>;
/** @type {Record<string, string>} */
export const DEFAULT_MIME_TYPES: Record<string, string>;
export const DEFAULT_CACHE_CONTROL: "public, max-age=31536000, immutable";
export const DEFAULT_THUMBNAIL_FORMATS: string[];
