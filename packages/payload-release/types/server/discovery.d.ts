/**
 * Parses markdown checkbox items into release steps.
 *
 * @param {string} content
 * @returns {Array<{ name: string, status: string, output: string }>}
 */
export function parseMarkdownCheckboxes(content: string): Array<{
    name: string;
    status: string;
    output: string;
}>;
/**
 * Safely inspects current git commit and dirty state.
 *
 * @returns {{ gitSha?: string, gitDirty?: boolean }}
 */
export function getGitInfo(): {
    gitSha?: string;
    gitDirty?: boolean;
};
/**
 * Safely determines pnpm and Node.js versions.
 *
 * @returns {{ nodeVersion: string, pnpmVersion?: string }}
 */
export function getRuntimeInfo(): {
    nodeVersion: string;
    pnpmVersion?: string;
};
/**
 * Resolves default root directory of the @nan0web/payload-release package.
 *
 * @returns {string}
 */
export function getPackageRootDir(): string;
/**
 * Discovers releases from filesystem search paths.
 *
 * @param {Object} [options]
 * @param {string} [options.projectRoot]
 * @param {string} [options.releasesDir='releases']
 * @param {string[]} [options.searchDirs]
 * @returns {Promise<Array<any>>}
 */
export function discoverReleases(options?: {
    projectRoot?: string | undefined;
    releasesDir?: string | undefined;
    searchDirs?: string[] | undefined;
}): Promise<Array<any>>;
