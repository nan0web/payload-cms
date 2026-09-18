import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SelfManualConfigModel } from '../../../../src/SelfManualConfigModel.js'
import { payloadSelfManual } from '../../../../src/index.js'
import { loadVocabulary, getTranslator, createSyncTranslator } from '../../../../src/i18n.js'

describe('payload-self-manual v0.3.0 release specification', () => {
  it('validates plugin options against SelfManualConfigModel schema', () => {
    const config = new SelfManualConfigModel({
      docsDir: 'custom/docs',
      defaultLocale: 'uk',
      multiDocView: 'tabs',
      releaseNotifications: 'badge_only',
    })

    assert.equal(config.docsDir, 'custom/docs')
    assert.equal(config.defaultLocale, 'uk')
    assert.equal(config.multiDocView, 'tabs')
    assert.equal(config.validate(), true)
  })

  it('asynchronously lazy-loads vocabularies without bundling all languages', async () => {
    const ukVocab = await loadVocabulary('uk')
    assert.ok(ukVocab)
    assert.equal(typeof ukVocab['Documentation Not Available'], 'string')

    const enVocab = await loadVocabulary('en')
    assert.ok(enVocab)
    assert.equal(enVocab['Documentation Not Available'], 'Documentation Not Available')
  })

  it('creates translation function with createT and supports custom overrides', async () => {
    const tUk = await getTranslator('uk', {
      uk: {
        'Documentation Not Available': 'Кастомний переклад відсутності',
      },
    })

    assert.equal(tUk('Documentation Not Available'), 'Кастомний переклад відсутності')
    assert.match(tUk('Help (⌘/ or Ctrl+/)'), /Довідка/)
  })

  it('provides synchronous fallback translator for initial SSR render', () => {
    const tSync = createSyncTranslator({ hello: 'Привіт {name}' }, 'uk')
    assert.equal(tSync('hello', { name: 'Світ' }), 'Привіт Світ')
  })

  it('rejects invalid configurations via ModelError', () => {
    assert.throws(() => {
      payloadSelfManual({ defaultLocale: 'invalid_lang_code' })
    }, /defaultLocale must be a valid/)

    assert.throws(() => {
      payloadSelfManual({ multiDocView: 'invalid_mode' })
    }, /multiDocView must be either/)
  })
})
