import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SelfManualConfigModel } from './SelfManualConfigModel.js'
import { payloadSelfManual } from './index.js'


describe('SelfManualConfigModel (Model-as-Schema v0.3.0)', () => {
  it('instantiates model with default values', () => {
    const config = new SelfManualConfigModel()
    assert.equal(config.docsDir, 'docs')
    assert.equal(config.defaultLocale, 'uk')
    assert.equal(config.multiDocView, 'tabs')
    assert.equal(config.releaseNotifications, 'full_tutorial')
    assert.deepEqual(config.translations, {})
    assert.equal(config.validate(), true)
  })

  it('validates custom valid options successfully', () => {
    const config = new SelfManualConfigModel({
      docsDir: 'custom/docs',
      defaultLocale: 'en',
      multiDocView: 'blocks',
      releaseNotifications: 'badge_only',
      translations: { en: { helpButtonAria: 'Help' } },
    })

    assert.equal(config.docsDir, 'custom/docs')
    assert.equal(config.defaultLocale, 'en')
    assert.equal(config.multiDocView, 'blocks')
    assert.equal(config.releaseNotifications, 'badge_only')
    assert.equal(config.validate(), true)
  })

  it('rejects invalid docsDir', () => {
    const config = new SelfManualConfigModel({ docsDir: '   ' })
    assert.throws(() => config.validate(), /docsDir must be a non-empty string/)
  })

  it('rejects invalid defaultLocale', () => {
    const config = new SelfManualConfigModel({ defaultLocale: 'invalid_locale_format' })
    assert.throws(() => config.validate(), /defaultLocale must be a valid 2-letter or region locale/)
  })

  it('rejects invalid multiDocView', () => {
    const config = new SelfManualConfigModel({ multiDocView: 'unknown-view' })
    assert.throws(() => config.validate(), /multiDocView must be either "tabs" or "blocks"/)
  })

  it('rejects invalid releaseNotifications', () => {
    const config = new SelfManualConfigModel({ releaseNotifications: 'everything' })
    assert.throws(() => config.validate(), /releaseNotifications must be one of/)
  })

  it('payloadSelfManual validates options using SelfManualConfigModel', () => {
    // Valid options work
    const plugin = payloadSelfManual({
      docsDir: 'docs',
      defaultLocale: 'uk',
      ui: { multiDocView: 'tabs' },
    })
    const payloadConfig = plugin({ admin: {} })
    assert.equal(payloadConfig.admin.custom.selfManual.defaultLocale, 'uk')
    assert.equal(payloadConfig.admin.custom.selfManual.ui.multiDocView, 'tabs')

    // Invalid options throw ModelError
    assert.throws(() => {
      payloadSelfManual({ defaultLocale: '12345' })
    }, /defaultLocale must be a valid/)
  })

  it('provides static UI translation constants for Model-First i18n', () => {
    assert.ok(SelfManualConfigModel.UI)
    assert.equal(typeof SelfManualConfigModel.UI.helpButtonAria, 'string')
    assert.equal(typeof SelfManualConfigModel.UI.helpButtonTitle, 'string')
    assert.equal(typeof SelfManualConfigModel.UI.dialogAria, 'string')
    assert.equal(typeof SelfManualConfigModel.UI.closeAria, 'string')
    assert.equal(typeof SelfManualConfigModel.UI.searchPlaceholder, 'string')
    assert.equal(typeof SelfManualConfigModel.UI.loading, 'string')
    assert.equal(typeof SelfManualConfigModel.UI.tabAll, 'string')
    assert.equal(typeof SelfManualConfigModel.UI.docNotAvailableTitle, 'string')
  })
})
