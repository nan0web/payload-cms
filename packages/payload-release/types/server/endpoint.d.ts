/**
 * Creates endpoint handler for serving release files securely.
 *
 * @param {Object} options
 * @param {string} [options.releasesDir='releases']
 * @param {Function} [options.readReleaseFile]
 * @returns {(req: any) => Promise<Response>}
 */
export function createReleaseFileEndpoint(options?: {
    releasesDir?: string | undefined;
    readReleaseFile?: Function | undefined;
}): (req: any) => Promise<Response>;
