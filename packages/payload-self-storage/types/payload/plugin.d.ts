/**
 * Checks if a Next.js App Router Route Handler exists for the given publicUrlPrefix.
 *
 * @param {string} publicUrlPrefix
 * @returns {boolean}
 */
export function checkMediaRouteHandler(publicUrlPrefix: string): boolean;
/**
 * @typedef {Object} PayloadSelfStorageOptions
 * @property {string} rootDir
 * @property {string} [thumbnailsDir='.thumbnails']
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
 * @property {(redirect: any) => Promise<void> | void} [onRedirect]
 */
/**
 * @typedef {Object} PayloadPluginProps
 * @property {import('../storage/local-backend.js').LocalBackend} backend
 * @property {string} rootDir
 */
/**
 * @typedef {((config: any) => any) & PayloadPluginProps} PayloadPluginFunction
 */
/**
 * @param {PayloadSelfStorageOptions} options
 * @returns {PayloadPluginFunction}
 */
export function payloadSelfStorage({ rootDir, thumbnailsDir, collections, publicUrlPrefix, legacyLookup, collision, convertImageSizesToWebp, lazySizes, mimeTypes, cacheControl, thumbnailFormats, isolateRouting, onRedirect, }: PayloadSelfStorageOptions): PayloadPluginFunction;
export type PayloadSelfStorageOptions = {
    rootDir: string;
    thumbnailsDir?: string | undefined;
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
    onRedirect?: ((redirect: any) => Promise<void> | void) | undefined;
};
export type PayloadPluginProps = {
    backend: import("../storage/local-backend.js").LocalBackend;
    rootDir: string;
};
export type PayloadPluginFunction = ((config: any) => any) & PayloadPluginProps;
