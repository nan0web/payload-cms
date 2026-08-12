import { createHash } from 'node:crypto'
import { pipeline } from 'node:stream/promises'
async function checksum(stream) {
  const hash = createHash('sha256')
  await pipeline(stream, hash)
  return hash.digest('hex')
}

/** Export backend files and metadata through an async record stream. */
export async function* exportFiles({ source, destination, records, dryRun = false }) {
  for await (const record of records || source.list()) {
    const input = await source.read(record.storageKey || record.relativeUrl)
    const sha256 = record.sha256 || await checksum(input)
    if (!dryRun) {
      const copy = await source.read(record.storageKey || record.relativeUrl)
      await destination.write(record.storageKey || record.relativeUrl, copy)
    }
    yield { ...record, sha256, sourceBackend: record.sourceBackend || 'source' }
  }
}
