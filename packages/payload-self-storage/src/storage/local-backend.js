import { createHash } from 'node:crypto'
import { access, mkdir, readdir, rename, stat, unlink } from 'node:fs/promises'
import { createReadStream, createWriteStream } from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { createPathPolicy } from './path-policy.js'

export class StorageFileNotFoundError extends Error {}
export class StorageCollisionError extends Error {}

/**
 * @typedef {Object} PathPolicy
 * @property {(value: string) => string} normalizeUrl
 * @property {(value: string) => string} storageKey
 * @property {(key: string) => string} relativeUrl
 * @property {(value: string) => { uri: string, filename: string, pathname: string }} parts
 */

/**
 * @typedef {Object} StorageWriteResult
 * @property {string} url
 * @property {string} storageKey
 * @property {string} path
 */

/**
 * @typedef {Object} StorageMoveResult
 * @property {string} from
 * @property {string} to
 */

/**
 * @typedef {Object} StoragePromoteResult
 * @property {string} url
 * @property {string} path
 * @property {boolean} moved
 */

/**
 * @typedef {Object} LocalBackend
 * @property {PathPolicy} policy
 * @property {(url: string, input: import('node:stream').Readable | Buffer | Uint8Array) => Promise<StorageWriteResult>} write
 * @property {(url: string) => Promise<import('node:fs').ReadStream>} read
 * @property {(url: string, useLegacy?: boolean) => Promise<boolean>} exists
 * @property {(url: string) => Promise<boolean>} existsExact
 * @property {(url: string) => Promise<import('node:fs').Stats>} stat
 * @property {(url: string) => Promise<void>} delete
 * @property {(fromUrl: string, toUrl: string) => Promise<StorageMoveResult>} move
 * @property {(url: string) => Promise<StoragePromoteResult>} promote
 * @property {(url: string, bytes?: number) => Promise<string>} hashHead
 * @property {(url: string) => Promise<string>} checksum
 * @property {(url1: string, url2: string) => Promise<boolean>} compare
 * @property {() => AsyncGenerator<any, void, unknown>} list
 */

/**
 * @param {Object} options
 * @param {string} options.rootDir
 * @param {string} [options.thumbnailsDir]
 * @param {string} [options.publicUrlPrefix]
 * @param {boolean} [options.legacyLookup]
 * @param {'reject'|'overwrite'} [options.collision]
 * @returns {LocalBackend}
 */
export function createLocalFilesystemBackend({
  rootDir,
  thumbnailsDir,
  publicUrlPrefix = '/media',
  legacyLookup = true,
  collision = 'reject',
}) {
  if (!rootDir) throw new TypeError('rootDir is required')
  const policy = createPathPolicy({ publicUrlPrefix })
  const filePath = (url) => path.join(rootDir, policy.storageKey(url))
  const safeLegacyPath = (url) => path.join(rootDir, path.basename(policy.storageKey(url)))
  async function locate(url, useLegacy = legacyLookup) {
    const canonical = filePath(url)
    try { await access(canonical); return canonical } catch {}
    if (useLegacy) { const legacy = safeLegacyPath(url); try { await access(legacy); return legacy } catch {} }
    throw new StorageFileNotFoundError(`File not found: ${policy.normalizeUrl(url)}`)
  }
  return {
    policy,
    async write(url, input) {
      const target = filePath(url)
      await mkdir(path.dirname(target), { recursive: true })
      if (collision === 'reject') { try { await access(target); throw new StorageCollisionError(`File exists: ${url}`) } catch (error) { if (error instanceof StorageCollisionError) throw error } }
      const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.${Date.now()}.tmp`)
      try { await pipeline(input, createWriteStream(temporary)); await rename(temporary, target) } finally { await unlink(temporary).catch(() => {}) }
      return { url: policy.normalizeUrl(url), storageKey: policy.storageKey(url), path: target }
    },
    async read(url) { return createReadStream(await locate(url)) },
    async exists(url, useLegacy = legacyLookup) { try { await locate(url, useLegacy); return true } catch (error) { if (error instanceof StorageFileNotFoundError) return false; throw error } },
    async existsExact(url) { try { await locate(url, false); return true } catch (error) { if (error instanceof StorageFileNotFoundError) return false; throw error } },
    async stat(url) { return stat(await locate(url)) },
    async delete(url) { await unlink(await locate(url, false)) },
    async move(fromUrl, toUrl) {
      const source = await locate(fromUrl); const target = filePath(toUrl)
      await mkdir(path.dirname(target), { recursive: true })
      if (collision === 'reject') { try { await access(target); throw new StorageCollisionError(`File exists: ${toUrl}`) } catch (error) { if (error instanceof StorageCollisionError) throw error } }
      await rename(source, target)
      return { from: policy.normalizeUrl(fromUrl), to: policy.normalizeUrl(toUrl) }
    },
    async promote(url) {
      const target = filePath(url)
      try { await access(target); return { url: policy.normalizeUrl(url), path: target, moved: false } } catch {}
      const source = safeLegacyPath(url)
      await access(source)
      await mkdir(path.dirname(target), { recursive: true })
      if (collision === 'reject') { try { await access(target); throw new StorageCollisionError(`File exists: ${url}`) } catch (error) { if (error instanceof StorageCollisionError) throw error } }
      await rename(source, target)
      return { url: policy.normalizeUrl(url), path: target, moved: true }
    },
    async hashHead(url, bytes = 1024) {
      const stream = createReadStream(await locate(url), { start: 0, end: bytes - 1 })
      const hash = createHash('sha256')
      await pipeline(stream, hash)
      return hash.digest('hex')
    },
    async checksum(url) { const hash = createHash('sha256'); await pipeline(createReadStream(await locate(url)), hash); return hash.digest('hex') },
    async compare(url1, url2) {
      try {
        const [stat1, stat2] = await Promise.all([this.stat(url1), this.stat(url2)])
        if (stat1.size !== stat2.size) return false
        const [head1, head2] = await Promise.all([this.hashHead(url1, 1024), this.hashHead(url2, 1024)])
        if (head1 !== head2) return false
        if (stat1.size <= 1024) return true
        const [hash1, hash2] = await Promise.all([this.checksum(url1), this.checksum(url2)])
        return hash1 === hash2
      } catch {
        return false
      }
    },
    async *list() {
      const resolvedThumbsDir = thumbnailsDir ? path.resolve(thumbnailsDir) : path.resolve(rootDir, '.thumbnails')
      async function* walk(dir) {
        let entries = []
        try { entries = await readdir(dir, { withFileTypes: true }) } catch { return }
        for (const entry of entries) {
          if (entry.name.startsWith('.')) continue
          const full = path.join(dir, entry.name)
          if (path.resolve(full) === resolvedThumbsDir || path.resolve(full).startsWith(resolvedThumbsDir + path.sep)) {
            continue
          }
          if (entry.isDirectory()) {
            yield* walk(full)
          } else if (entry.isFile()) {
            const relPath = path.relative(rootDir, full).replaceAll('\\', '/')
            yield {
              storageKey: relPath,
              relativeUrl: policy.relativeUrl(relPath),
              path: full,
            }
          }
        }
      }
      yield* walk(rootDir)
    }
  }
}
