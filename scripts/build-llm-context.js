import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const outputFile = path.join(rootDir, 'llms-full.txt')

function stripFrontmatter(content) {
	return content.replace(/^---[\s\S]*?---\n/, '')
}

function buildLlmsFull() {
	console.log(`🔨 Building llms-full.txt...`)

	let fullText = `==================================================================\n`
	fullText += `@nan0web/payload-cms — FULL LLM CONTEXT BUNDLE\n`
	fullText += `Generated: ${new Date().toISOString()}\n`
	fullText += `==================================================================\n\n`

	// 1. Root llms.txt
	const llmsPath = path.join(rootDir, 'llms.txt')
	if (fs.existsSync(llmsPath)) {
		fullText += `--- START OF FILE: llms.txt ---\n`
		fullText += fs.readFileSync(llmsPath, 'utf8')
		fullText += `\n--- END OF FILE: llms.txt ---\n\n`
	}

	// 2. docs/AGENTS.md
	const agentsPath = path.join(rootDir, 'docs/AGENTS.md')
	if (fs.existsSync(agentsPath)) {
		fullText += `--- START OF FILE: docs/AGENTS.md ---\n`
		fullText += fs.readFileSync(agentsPath, 'utf8')
		fullText += `\n--- END OF FILE: docs/AGENTS.md ---\n\n`
	}

	// 3. docs/uk/workflows/*.md
	const workflowsDir = path.join(rootDir, 'docs/uk/workflows')
	if (fs.existsSync(workflowsDir)) {
		const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.md')).sort()
		files.forEach(file => {
			const filePath = path.join(workflowsDir, file)
			const content = stripFrontmatter(fs.readFileSync(filePath, 'utf8'))
			fullText += `--- START OF WORKFLOW: docs/uk/workflows/${file} ---\n`
			fullText += content
			fullText += `\n--- END OF WORKFLOW: docs/uk/workflows/${file} ---\n\n`
		})
	}

	fs.writeFileSync(outputFile, fullText, 'utf8')
	console.log(`✨ Generated llms-full.txt (${fullText.length} characters) successfully!`)
}

buildLlmsFull()
