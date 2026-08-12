import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { exportFiles, restoreFiles } from '../src/index.js'

function backend(initial = {}) {
  const files = new Map(Object.entries(initial))
  return {
    files,
    async read(key) {
      if (!files.has(key)) throw new Error(`missing ${key}`)
      return Readable.from(files.get(key))
    },
    async write(key, stream) {
      let value = ''
      for await (const chunk of stream) value += chunk
      files.set(key, value)
    },
    async *list() { for (const storageKey of files.keys()) yield { storageKey } }
  }
}

describe('backend-neutral backup', () => {
  it('exports and restores through streams with verification and dry-run', async () => {
    const source = backend({ 'a.txt': 'alpha' })
    const backup = backend()
    const records = exportFiles({ source, destination: backup })
    const exported = []
    for await (const record of records) exported.push({ ...record, size: 5, relativeUrl: '/media/a.txt', mimeType: 'text/plain' })
    assert.equal(backup.files.get('a.txt'), 'alpha')
    const destination = backend()
    const report = await restoreFiles({ source: backup, destination, records: exported, verify: true })
    assert.deepEqual(report, { restored: 1, missing: [], changed: [], orphan: [] })
    assert.equal(destination.files.get('a.txt'), 'alpha')
    const dry = backend()
    const dryReport = await restoreFiles({ source: backup, destination: dry, records: exported, dryRun: true })
    assert.equal(dryReport.restored, 1)
    assert.equal(dry.files.size, 0)
  })
})
