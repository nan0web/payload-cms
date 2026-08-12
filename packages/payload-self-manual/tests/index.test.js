import { test } from 'node:test'
import assert from 'node:assert'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadDocumentation, payloadSelfManual, renderMarkdown, resolveDocPath, isMermaidFence, scanDocumentationIndex } from '../src/index.js'

test('resolveDocPath prevents directory traversal attacks', () => {
  const baseDocsDir = '/Users/i/src/apps/payload-cms/docs'
  
  const validPath = resolveDocPath(baseDocsDir, 'uk', 'collections/media')
  assert.strictEqual(validPath, '/Users/i/src/apps/payload-cms/docs/uk/payload/collections/media.md')

  const unsafePath = resolveDocPath(baseDocsDir, 'uk', '../../etc/passwd')
  assert.strictEqual(unsafePath, null)
})

test('payloadSelfManual configures default UI options and releaseNotifications', () => {
  const plugin = payloadSelfManual()
  const result = plugin({ admin: {} })

  assert.strictEqual(result.admin.custom.selfManual.enabled, true)
  assert.strictEqual(result.admin.custom.selfManual.defaultLocale, 'uk')
  assert.strictEqual(result.admin.custom.selfManual.ui.sidebarMenu, true)
  assert.strictEqual(result.admin.custom.selfManual.ui.headerHelpButton, true)
  assert.strictEqual(result.admin.custom.selfManual.ui.settingsTab, false)
  assert.strictEqual(result.admin.custom.selfManual.releaseNotifications, 'full_tutorial')
  assert.equal(result.endpoints[0].path, '/_self-manual')
  assert.equal(result.endpoints[0].method, 'get')
})

test('payloadSelfManual respects custom UI options and releaseNotifications', () => {
  const plugin = payloadSelfManual({
    ui: { sidebarMenu: false, headerHelpButton: true, settingsTab: true },
    releaseNotifications: 'badge_only'
  })
  const result = plugin({ admin: {} })

  assert.strictEqual(result.admin.custom.selfManual.ui.sidebarMenu, false)
  assert.strictEqual(result.admin.custom.selfManual.ui.headerHelpButton, true)
  assert.strictEqual(result.admin.custom.selfManual.ui.settingsTab, true)
  assert.strictEqual(result.admin.custom.selfManual.releaseNotifications, 'badge_only')
})

test('loads requested locale and falls back to default locale', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'self-manual-'))
  await mkdir(path.join(root, 'uk', 'payload', 'collections'), { recursive: true })
  await writeFile(path.join(root, 'uk', 'payload', 'collections', 'media.md'), '# Media')
  const result = await loadDocumentation({ docsDir: root, locale: 'en', defaultLocale: 'uk', slug: 'collections/media' })
  assert.equal(result.found, true)
  assert.equal(result.locale, 'uk')
})

test('renders rich safe markdown and detects Mermaid fences', () => {
  const html = renderMarkdown('# Title\n\n<script>alert(1)</script>\n\n- one\n- two\n\n| Name | Value |\n| --- | --- |\n| A | `code` |\n\n[unsafe](javascript:alert(1))\n\n```js\nconst value = 1\n```\n\n```mermaid\ngraph TD\n```')
  assert.match(html, /<h1>Title<\/h1>/)
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /<ul>[\s\S]*<li>one<\/li>[\s\S]*<li>two<\/li>/)
  assert.match(html, /<table>/)
  assert.match(html, /<code>code<\/code>/)
  assert.match(html, /<pre><code class="language-js">/)
  assert.doesNotMatch(html, /href=["']javascript:/i)
  assert.match(html, /self-manual-mermaid/)
  assert.equal(isMermaidFence('MERMAID'), true)
})

test('scanDocumentationIndex includes searchText for full-text search', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'self-manual-'))
  await mkdir(path.join(root, 'en', 'payload'), { recursive: true })
  await writeFile(path.join(root, 'en', 'payload', 'test.md'), '# Test Document\n\nThis is a test content with some keywords.')
  const index = await scanDocumentationIndex(root, 'en')
  assert.equal(index.length, 3) // test, dashboard, collections/media
  const testDoc = index.find(doc => doc.slug === 'test')
  assert.ok(testDoc)
  assert.ok(testDoc.searchText.includes('test content'))
  assert.ok(testDoc.searchText.includes('keywords'))
})
