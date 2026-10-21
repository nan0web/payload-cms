import MarkdownIt from 'markdown-it'

/**
 * Escapes HTML characters.
 * @param {any} value
 * @returns {string}
 */
function escapeHtml(value) {
	return String(value ?? '').replace(
		/[&<>"']/g,
		(ch) =>
			({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;',
			})[ch]
	)
}

const md = new MarkdownIt({
	html: true,
	breaks: true,
	linkify: true,
	typographer: true,
})

md.renderer.rules.fence = (tokens, idx) => {
	const token = tokens[idx]
	const lang = token.info.trim().split(/\s+/, 1)[0]
	const className = lang ? ` class="language-${escapeHtml(lang)}"` : ''
	return `<pre><code${className}>${escapeHtml(token.content)}</code></pre>\n`
}

/**
 * Strips YAML frontmatter block (--- ... ---) from markdown text.
 * @param {string} text
 * @returns {string}
 */
export function stripFrontmatter(text) {
	const str = String(text || '')
	if (str.startsWith('---')) {
		const endIdx = str.indexOf('\n---', 3)
		if (endIdx !== -1) {
			const afterEnd = endIdx + 4
			return str.slice(afterEnd).replace(/^\r?\n/, '')
		}
	}
	return str
}

/**
 * Transforms task list markdown checkboxes into stylish HTML task badges
 * @param {string} text
 * @returns {string}
 */
export function renderTaskCheckboxes(text) {
	return String(text || '').replace(
		/^([\s*-]*|\d+\.\s*)\[([ xX])\]\s*(.+)$/gm,
		(match, prefix, check, taskContent) => {
			const isDone = check.toLowerCase() === 'x'
			const checkedIcon = `<span class="nan0-task-checkbox ${isDone ? 'checked' : 'pending'}" aria-hidden="true">${isDone ? '✓' : ''}</span>`
			return `${prefix}${checkedIcon} <span class="nan0-task-text ${isDone ? 'done' : ''}">${taskContent}</span>`
		}
	)
}

/**
 * Renders Markdown string to safe HTML.
 * @param {string} markdown
 * @param {Object} [options]
 * @param {boolean} [options.stripFrontmatter=true]
 * @returns {string}
 */
export function renderMarkdown(markdown, options = {}) {
	const shouldStrip = options.stripFrontmatter !== false
	let content = shouldStrip ? stripFrontmatter(markdown) : String(markdown || '')
	content = renderTaskCheckboxes(content)
	return md.render(content)
}
