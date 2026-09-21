import MarkdownIt from 'markdown-it'

/**
 * Checks if code fence language is Mermaid.
 * @param {string} language
 * @returns {boolean}
 */
export function isMermaidFence(language) {
	return (
		typeof language === 'string' && language.trim().toLowerCase() === 'mermaid'
	)
}

/**
 * HTML escaper for markdown content and attributes.
 * @param {any} value
 * @returns {string}
 */
export function escapeHtml(value) {
	return String(value).replace(
		/[&<>"']/g,
		(character) =>
			({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;',
			})[character]
	)
}

const markdownRenderer = new MarkdownIt({
	html: false,
	breaks: true,
	linkify: true,
	typographer: true,
})

markdownRenderer.renderer.rules.fence = (tokens, index) => {
	const token = tokens[index]
	const language = token.info.trim().split(/\s+/, 1)[0]
	if (isMermaidFence(language)) {
		return `<div class="self-manual-mermaid" data-mermaid="${escapeHtml(token.content.trim())}"></div>`
	}
	const className = language ? ` class="language-${escapeHtml(language)}"` : ''
	return `<pre><code${className}>${escapeHtml(token.content)}</code></pre>\n`
}

/**
 * Renders raw Markdown into safe HTML.
 * @param {string} markdown
 * @returns {string}
 */
export function renderMarkdown(markdown) {
	return markdownRenderer.render(String(markdown || ''))
}
