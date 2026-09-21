/**
 * @typedef {Object} PayloadSelfStorageOptions
 * @property {string} publicOrigin
 * @property {string} [rootDir]
 * @property {string[]} [collections]
 * @property {string} [publicUrlPrefix]
 * @property {boolean} [legacyLookup]
 * @property {'reject'|'overwrite'} [collision]
 * @property {boolean} [convertImageSizesToWebp]
 * @property {boolean} [lazySizes]
 * @property {Record<string, string>} [mimeTypes]
 * @property {string} [cacheControl]
 * @property {string[]} [thumbnailFormats]
 * @property {boolean} [isolateRouting]
 * @property {(redirect: object) => Promise<void>} [onRedirect]
 */
/**
 * @param {PayloadSelfStorageOptions} options
 * @returns {((config: import('payload').Config | Promise<import('payload').Config>) => Promise<import('payload').Config>) & { backend: import('../storage/local-backend.js').LocalBackend, version: string }}
 */
export function payloadSelfStorage({ rootDir, publicOrigin, collections, publicUrlPrefix, legacyLookup, collision, convertImageSizesToWebp, lazySizes, mimeTypes, cacheControl, thumbnailFormats, isolateRouting, onRedirect, }?: PayloadSelfStorageOptions): ((config: import("payload").Config | Promise<import("payload").Config>) => Promise<import("payload").Config>) & {
    backend: import("../storage/local-backend.js").LocalBackend;
    version: string;
};
export type PayloadSelfStorageOptions = {
    publicOrigin: string;
    rootDir?: string | undefined;
    collections?: string[] | undefined;
    publicUrlPrefix?: string | undefined;
    legacyLookup?: boolean | undefined;
    collision?: "reject" | "overwrite" | undefined;
    convertImageSizesToWebp?: boolean | undefined;
    lazySizes?: boolean | undefined;
    mimeTypes?: Record<string, string> | undefined;
    cacheControl?: string | undefined;
    thumbnailFormats?: string[] | undefined;
    isolateRouting?: boolean | undefined;
    onRedirect?: ((redirect: object) => Promise<void>) | undefined;
};
