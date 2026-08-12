import { mkdir } from 'node:fs/promises'
import path from 'node:path'

/**
 * Create the SQLite index contract. The caller supplies a SQLite driver so the
 * package remains free of native/provider dependencies.
 */
export async function createBackupIndex({ filename, database }) {
  if (!database || typeof database.exec !== 'function') throw new TypeError('A SQLite-compatible database is required')
  await mkdir(path.dirname(filename), { recursive: true })
  database.exec(`CREATE TABLE IF NOT EXISTS files (storageKey TEXT PRIMARY KEY, relativeUrl TEXT NOT NULL, size INTEGER NOT NULL, mtime TEXT NOT NULL, mimeType TEXT, sha256 TEXT NOT NULL, sourceBackend TEXT NOT NULL)`)
  return {
    async add(record) {
      const statement = database.prepare?.('INSERT OR REPLACE INTO files (storageKey, relativeUrl, size, mtime, mimeType, sha256, sourceBackend) VALUES (?, ?, ?, ?, ?, ?, ?)')
      if (!statement) throw new TypeError('SQLite database must support prepare()')
      statement.run(record.storageKey, record.relativeUrl, record.size, record.mtime, record.mimeType ?? null, record.sha256, record.sourceBackend)
    }
  }
}
