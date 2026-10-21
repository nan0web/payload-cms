/**
 * Configure payload-release plugin for Payload CMS.
 *
 * @param {Object} [options]
 * @param {string} [options.releasesDir='releases']
 * @param {boolean} [options.allowPreview=true]
 * @param {boolean} [options.autoDiscover=true]
 * @returns {(config: any) => any}
 */
export function payloadRelease(options?: {
    releasesDir?: string | undefined;
    allowPreview?: boolean | undefined;
    autoDiscover?: boolean | undefined;
}): (config: any) => any;
export default payloadRelease;
import { ReleaseConfigModel } from './domain/ReleaseConfigModel.js';
import { ReleasesCollection } from './collections/Releases.js';
import { buildReleasesCollection } from './collections/Releases.js';
import { createReleaseFileEndpoint } from './server/endpoint.js';
import { renderMarkdown } from './server/markdown.js';
import { stripFrontmatter } from './server/markdown.js';
import { discoverReleases } from './server/discovery.js';
import { parseMarkdownCheckboxes } from './server/discovery.js';
import { getGitInfo } from './server/discovery.js';
import { getRuntimeInfo } from './server/discovery.js';
import { getPackageRootDir } from './server/discovery.js';
import { TourStepModel } from './domain/TourStepModel.js';
import { TourManifestModel } from './domain/TourStepModel.js';
import { parseTourNan0 } from './domain/TourStepModel.js';
import { mergeTourWithLocale } from './domain/TourStepModel.js';
export { ReleaseConfigModel, ReleasesCollection, buildReleasesCollection, createReleaseFileEndpoint, renderMarkdown, stripFrontmatter, discoverReleases, parseMarkdownCheckboxes, getGitInfo, getRuntimeInfo, getPackageRootDir, TourStepModel, TourManifestModel, parseTourNan0, mergeTourWithLocale };
