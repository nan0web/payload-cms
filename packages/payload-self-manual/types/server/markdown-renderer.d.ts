/**
 * Checks if code fence language is Mermaid.
 * @param {string} language
 * @returns {boolean}
 */
export function isMermaidFence(language: string): boolean;
/**
 * HTML escaper for markdown content and attributes.
 * @param {any} value
 * @returns {string}
 */
export function escapeHtml(value: any): string;
/**
 * Renders raw Markdown into safe HTML.
 * @param {string} markdown
 * @returns {string}
 */
export function renderMarkdown(markdown: string): string;
