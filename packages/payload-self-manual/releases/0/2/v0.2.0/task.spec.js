import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { loadDocumentation, scanDocumentationIndex, payloadSelfManual } from '../../../../src/index.js'

describe('payload-self-manual v0.2.0 multi-plugin contract', () => {
  it('loads and aggregates documentation sections from multiple docs sources', async (t) => {
    const root1 = await mkdtemp(path.join(os.tmpdir(), 'manual-source1-'))
    const root2 = await mkdtemp(path.join(os.tmpdir(), 'manual-source2-'))
    t.after(async () => {
      await rm(root1, { recursive: true, force: true })
      await rm(root2, { recursive: true, force: true })
    })

    // Source 1 (e.g. base or project docs)
    await mkdir(path.join(root1, 'uk', 'payload', 'collections'), { recursive: true })
    await writeFile(
      path.join(root1, 'uk', 'payload', 'collections', 'media.md'),
      '# Базова Медіа Колекція\n\nОпис завантаження медіа файлів у системі.'
    )

    // Source 2 (e.g. payload-self-storage docs)
    await mkdir(path.join(root2, 'uk', 'payload', 'collections'), { recursive: true })
    await writeFile(
      path.join(root2, 'uk', 'payload', 'collections', 'media.md'),
      '# Self Storage Integration\n\nЗбереження у фізичні вкладені папки та дедуплікація.'
    )

    const docSources = [
      { id: 'base', source: 'app-base', title: 'Базова Медіа', docsDir: root1 },
      { id: 'self-storage', source: '@nan0web/payload-self-storage', title: 'Self Storage', docsDir: root2 }
    ]

    const result = await loadDocumentation({
      docsDir: root1,
      docSources,
      locale: 'uk',
      slug: 'collections/media'
    })

    assert.equal(result.found, true)
    assert.ok(Array.isArray(result.sections))
    assert.equal(result.sections.length, 2)
    assert.equal(result.sections[0].id, 'base')
    assert.match(result.sections[0].markdown, /Базова Медіа Колекція/)
    assert.equal(result.sections[1].id, 'self-storage')
    assert.match(result.sections[1].markdown, /Self Storage Integration/)
  })

  it('scans index across multiple docs sources and removes duplicates by slug', async (t) => {
    const root1 = await mkdtemp(path.join(os.tmpdir(), 'manual-idx1-'))
    const root2 = await mkdtemp(path.join(os.tmpdir(), 'manual-idx2-'))
    t.after(async () => {
      await rm(root1, { recursive: true, force: true })
      await rm(root2, { recursive: true, force: true })
    })

    await mkdir(path.join(root1, 'uk', 'payload'), { recursive: true })
    await writeFile(path.join(root1, 'uk', 'payload', 'dashboard.md'), '# Dashboard Base')

    await mkdir(path.join(root2, 'uk', 'payload'), { recursive: true })
    await writeFile(path.join(root2, 'uk', 'payload', 'storage-guide.md'), '# Storage Guide Extra')

    const docSources = [
      { id: 's1', docsDir: root1 },
      { id: 's2', docsDir: root2 }
    ]

    const index = await scanDocumentationIndex(root1, 'uk', [], docSources)
    const slugs = index.map(i => i.slug)

    assert.ok(slugs.includes('dashboard'))
    assert.ok(slugs.includes('storage-guide'))
  })

  it('configures multiDocView option in payloadSelfManual plugin', () => {
    const pluginTabs = payloadSelfManual({ ui: { multiDocView: 'tabs' } })
    const resTabs = pluginTabs({ admin: {} })
    assert.equal(resTabs.admin.custom.selfManual.ui.multiDocView, 'tabs')

    const pluginBlocks = payloadSelfManual({ ui: { multiDocView: 'blocks' } })
    const resBlocks = pluginBlocks({ admin: {} })
    assert.equal(resBlocks.admin.custom.selfManual.ui.multiDocView, 'blocks')
  })

  it('provides cascade i18n fallback and respects custom translations', async () => {
    // Test loadDocumentation fallback with Ukrainian locale
    const resUk = await loadDocumentation({
      docsDir: '/non-existing-path-12345',
      locale: 'uk',
      defaultLocale: 'uk',
      slug: 'unknown-feature',
    })
    assert.equal(resUk.found, false)
    assert.match(resUk.markdown, /Документацію не знайдено/)
    assert.match(resUk.markdown, /Наразі документацію для \*\*unknown-feature\*\* не знайдено/)

    // Test loadDocumentation fallback with English locale
    const resEn = await loadDocumentation({
      docsDir: '/non-existing-path-12345',
      locale: 'en',
      defaultLocale: 'en',
      slug: 'unknown-feature',
    })
    assert.equal(resEn.found, false)
    assert.match(resEn.markdown, /Documentation Not Available/)
    assert.match(resEn.markdown, /No documentation is currently available for \*\*unknown-feature\*\*/)

    // Test custom translations override via options
    const resCustom = await loadDocumentation({
      docsDir: '/non-existing-path-12345',
      locale: 'uk',
      defaultLocale: 'uk',
      slug: 'unknown-feature',
      translations: {
        uk: {
          'Documentation Not Available': 'Користувацький заголовок відсутності',
        },
      },
    })
    assert.match(resCustom.markdown, /Користувацький заголовок відсутності/)
  })
})

