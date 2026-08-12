import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_STORAGE_KEY, normalizeTheme, payloadSigninThemeState, readTheme, resolveTheme, writeTheme } from '../src/index.js'
import { getFirstPaintThemeScript } from '../src/first-paint.js'

function storage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
}

test('persists valid themes and rejects invalid values', () => {
  const store = storage()
  assert.equal(normalizeTheme('dark'), 'dark')
  assert.equal(normalizeTheme('blue'), null)
  assert.equal(writeTheme(store, 'dark'), true)
  assert.equal(readTheme(store), 'dark')
  assert.equal(writeTheme(store, 'blue'), false)
  assert.equal(readTheme(store), 'dark')
})

test('uses system preference only when selected', () => {
  assert.equal(resolveTheme('system', true), 'dark')
  assert.equal(resolveTheme('system', false), 'light')
  assert.equal(resolveTheme('light', true), 'light')
})

test('generates first-paint script with a configurable key and validation', () => {
  const script = getFirstPaintThemeScript('custom-theme')
  assert.match(script, /custom-theme/)
  assert.match(script, /localStorage/)
  assert.match(script, /prefers-color-scheme/)
  assert.match(script, /t!=='light'&&t!=='dark'&&t!=='system'/)
})

test('transforms Payload config without replacing existing components', () => {
  const plugin = payloadSigninThemeState({ storageKey: 'custom-theme' })
  const existing = { path: './ExistingProvider' }
  const result = plugin({ admin: { components: { providers: [existing], beforeLogin: 'ExistingLogin' } } })
  assert.deepEqual(result.admin.components.providers[0], existing)
  assert.equal(result.admin.components.providers[1], '@nan0web/payload-signin-theme-state/admin#ThemeProvider')
  assert.equal(result.admin.components.beforeLogin[0], 'ExistingLogin')
  assert.equal(result.admin.components.beforeLogin[1], '@nan0web/payload-signin-theme-state/first-paint#ThemeFirstPaint')
})

test('uses the stable default key', () => {
  assert.equal(DEFAULT_STORAGE_KEY, 'payload-signin-theme')
})
