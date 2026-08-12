import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const llmsPath = path.join(rootDir, 'llms.txt')
const workflowsDir = path.join(rootDir, 'docs/uk/workflows')
const workflowsReadmePath = path.join(workflowsDir, 'README.md')
const packagesDir = path.join(rootDir, 'packages')

function getPluginDirectories() {
	let plugins = []
	if (fs.existsSync(packagesDir)) {
		const entries = fs.readdirSync(packagesDir, { withFileTypes: true })
		plugins = entries
			.filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
			.filter(entry => fs.existsSync(path.join(packagesDir, entry.name, 'package.json')))
			.map(entry => `packages/${entry.name}`)
	}
	if (fs.existsSync(path.join(rootDir, 'testing-app', 'package.json'))) {
		plugins.push('testing-app')
	}
	return plugins.sort()
}

function getWorkflowFiles() {
	if (!fs.existsSync(workflowsDir)) return []
	return fs.readdirSync(workflowsDir)
		.filter(file => file.endsWith('.md') && file !== 'README.md')
		.sort()
}

function checkContext(autoFix = false) {
	const plugins = getPluginDirectories()
	const workflows = getWorkflowFiles()

	let llmsContent = fs.existsSync(llmsPath) ? fs.readFileSync(llmsPath, 'utf8') : ''
	let readmeContent = fs.existsSync(workflowsReadmePath) ? fs.readFileSync(workflowsReadmePath, 'utf8') : ''

	const missingPluginsInLlms = plugins.filter(p => !llmsContent.includes(p))
	const missingWorkflowsInLlms = workflows.filter(w => !llmsContent.includes(w))
	const missingWorkflowsInReadme = workflows.filter(w => !readmeContent.includes(w))

	console.log(`🔍 Checking Monorepo LLM Context Integrity...`)
	console.log(`📦 Packages & Apps found (${plugins.length}):`, plugins.join(', '))
	console.log(`📑 Workflows found (${workflows.length}):`, workflows.join(', '))

	let hasErrors = false

	if (missingPluginsInLlms.length > 0) {
		console.warn(`⚠️ Missing packages in llms.txt:`, missingPluginsInLlms)
		hasErrors = true
	}

	if (missingWorkflowsInLlms.length > 0) {
		console.warn(`⚠️ Missing workflows in llms.txt:`, missingWorkflowsInLlms)
		hasErrors = true
	}

	if (missingWorkflowsInReadme.length > 0) {
		console.warn(`⚠️ Missing workflows in docs/uk/workflows/README.md:`, missingWorkflowsInReadme)
		hasErrors = true
	}

	if (!hasErrors) {
		console.log(`✅ All monorepo packages and workflows are 100% registered in llms.txt & README.md!`)
	} else if (autoFix) {
		console.log(`🛠 Auto-fixing llms.txt and README.md...`)
		let updatedLlms = `# @nan0web/payload-cms Monorepo\n\n`
		updatedLlms += `> Monorepo ecosystem for Payload CMS 3.x plugins and applications (@nan0web/payload-*). Built with pure ESM, Model-as-Schema architecture, DevSecOps principles, and OLMUI (One Logic — Multiple User Interfaces).\n\n`
		updatedLlms += `## Core Documentation & Agent Rules\n\n`
		updatedLlms += `- [AGENTS.md](docs/AGENTS.md): Main agent system prompt, Architechnomag persona, DevSecOps rules, and linguistic sovereignty.\n\n`
		updatedLlms += `## Workflows & Instructions\n\n`
		updatedLlms += `- [Workflows Index](docs/uk/workflows/README.md): Index of localized workflows.\n`
		workflows.forEach(w => {
			const title = w.replace('.md', '')
			updatedLlms += `- [${title}](docs/uk/workflows/${w})\n`
		})
		updatedLlms += `\n## Packages & Applications\n\n`
		plugins.forEach(p => {
			updatedLlms += `- [${p}](./${p})\n`
		})
		fs.writeFileSync(llmsPath, updatedLlms, 'utf8')
		console.log(`✨ Successfully updated llms.txt!`)
	}
}

const autoFix = process.argv.includes('--fix')
checkContext(autoFix)
