/**
 * Strips YAML frontmatter block (--- ... ---) from markdown text.
 * @param {string} text
 * @returns {string}
 */
export function stripFrontmatter(text: string): string;
/**
 * Transforms task list markdown checkboxes into stylish HTML task badges
 * @param {string} text
 * @returns {string}
 */
export function renderTaskCheckboxes(text: string): string;
/**
 * Renders Markdown string to safe HTML.
 * @param {string} markdown
 * @param {Object} [options]
 * @param {boolean} [options.stripFrontmatter=true]
 * @returns {string}
 */
export function renderMarkdown(markdown: string, options?: {
    stripFrontmatter?: boolean | undefined;
}): string;
