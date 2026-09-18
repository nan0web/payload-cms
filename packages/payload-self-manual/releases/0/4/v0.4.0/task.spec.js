import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { inspectPlugins, payloadSelfManual, createDocumentationEndpoint } from '../../../../src/index.js'
import { SelfManualConfigModel } from '../../../../src/SelfManualConfigModel.js'
import { loadVocabulary } from '../../../../src/i18n.js'

describe('payload-self-manual v0.4.0 ecosystem & plugins introspection contract', () => {
  it('inspects plugins from Payload configuration including registered docs and custom metadata', () => {
    const mockConfig = {
      plugins: [
        () => {}, // anonymous plugin function
      ],
      custom: {
        selfManualDocs: [
          {
            id: 'self-storage',
            source: '@nan0web/payload-self-storage',
            title: 'Self Storage',
            docsDir: '/mock/docs/storage',
          },
        ],
      },
      admin: {
        custom: {
          selfManual: {
            enabled: true,
            version: '0.4.0',
            docsDir: 'docs',
            defaultLocale: 'uk',
          },
        },
      },
    }

    const report = inspectPlugins(mockConfig)

    assert.ok(report)
    assert.ok(Array.isArray(report.plugins))
    
    // Checks self-manual plugin detection
    const selfManual = report.plugins.find(p => p.name === '@nan0web/payload-self-manual' || p.id === 'self-manual')
    assert.ok(selfManual, 'self-manual plugin should be detected')
    assert.equal(selfManual.status, 'active')

    // Checks self-storage plugin detection via selfManualDocs
    const selfStorage = report.plugins.find(p => p.name === '@nan0web/payload-self-storage' || p.id === 'self-storage')
    assert.ok(selfStorage, 'self-storage plugin should be detected')
    assert.equal(selfStorage.hasDocs, true)
    assert.equal(selfStorage.title, 'Self Storage')
  })

  it('provides system introspection info via createDocumentationEndpoint when info=system is requested', async () => {
    const mockConfig = {
      custom: {
        selfManualDocs: [
          { id: 'plugin-a', source: '@nan0web/payload-plugin-a', title: 'Plugin A', docsDir: '/docs/a' },
        ],
      },
      admin: {
        custom: {
          selfManual: {
            enabled: true,
            defaultLocale: 'uk',
          },
        },
      },
    }

    const handler = createDocumentationEndpoint({
      docsDir: 'docs',
      defaultLocale: 'uk',
      getConfig: () => mockConfig,
    })

    const req = { url: 'http://payload.local/api/_self-manual?info=system&locale=uk' }
    const response = await handler(req)
    assert.equal(response.status, 200)

    const data = await response.json()
    assert.ok(data.system)
    assert.ok(Array.isArray(data.system.plugins))
    assert.ok(data.system.plugins.some(p => p.id === 'plugin-a'))
  })

  it('contains all required UI translation keys in SelfManualConfigModel.UI', async () => {
    const { UI } = SelfManualConfigModel
    assert.ok(UI.pluginsTab, 'pluginsTab key must exist')
    assert.ok(UI.pluginsHeader, 'pluginsHeader key must exist')
    assert.ok(UI.pluginName, 'pluginName key must exist')
    assert.ok(UI.pluginVersion, 'pluginVersion key must exist')
    assert.ok(UI.pluginStatus, 'pluginStatus key must exist')
    assert.ok(UI.pluginDocs, 'pluginDocs key must exist')
    assert.ok(UI.pluginDocsAvailable, 'pluginDocsAvailable key must exist')
    assert.ok(UI.pluginDocsMissing, 'pluginDocsMissing key must exist')
    assert.ok(UI.activeStatus, 'activeStatus key must exist')

    const ukVocab = await loadVocabulary('uk')
    const enVocab = await loadVocabulary('en')

    assert.ok(ukVocab[UI.pluginsTab])
    assert.ok(enVocab[UI.pluginsTab])
    assert.ok(ukVocab[UI.pluginsHeader])
    assert.ok(enVocab[UI.pluginsHeader])
  })
})
