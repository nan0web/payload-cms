/**
 * Builds the Payload CMS Collection configuration for Releases.
 *
 * @param {Object} [options]
 * @param {boolean} [options.allowPreview=true]
 * @returns {import('payload').CollectionConfig}
 */
export function buildReleasesCollection(options?: {
    allowPreview?: boolean | undefined;
}): import("payload").CollectionConfig;
export const ReleasesCollection: import("payload").CollectionConfig<any>;
