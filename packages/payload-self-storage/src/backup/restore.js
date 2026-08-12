import { createHash } from 'node:crypto'
import { pipeline } from 'node:stream/promises'
async function digest(stream) {
  const hash = createHash('sha256')
  await pipeline(stream, hash)
  return hash.digest('hex')
}

/** Restore records one at a time without loading the full index in memory. */
export async function restoreFiles({ source, destination, records, verify = false, dryRun = false }) {
  const report = { restored: 0, missing: [], changed: [], orphan: [] }
  const expected = new Set()
  for await (const record of records) {
    expected.add(record.storageKey)
    let input
    try { input = await source.read(record.storageKey) } catch { report.missing.push(record.storageKey); continue }
    if (verify) {
      const actual = await digest(input)
      if (actual !== record.sha256) { report.changed.push({ storageKey: record.storageKey, expected: record.sha256, actual }); continue }
    }
    if (!dryRun) await destination.write(record.storageKey, await source.read(record.storageKey))
    report.restored += 1
  }
  if (source.list) for await (const item of source.list()) if (!expected.has(item.storageKey)) report.orphan.push(item.storageKey)
  return report
}
