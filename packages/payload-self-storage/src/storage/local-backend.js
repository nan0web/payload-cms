import { createHash } from 'node:crypto'
import { access, mkdir, readdir, rename, stat, unlink } from 'node:fs/promises'
import { createReadStream, createWriteStream } from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { createPathPolicy } from './path-policy.js'

export class StorageFileNotFoundError extends Error {}
export class StorageCollisionError extends Error {}

export function createLocalFilesystemBackend({ rootDir, publicUrlPrefix = '/media', legacyLookup = true, collision = 'reject' }) {
  if (!rootDir) throw new TypeError('rootDir is required')
  const policy = createPathPolicy({ publicUrlPrefix })
  const filePath = (url) => path.join(rootDir, policy.storageKey(url))
  const safeLegacyPath = (url) => path.join(rootDir, path.basename(policy.storageKey(url)))
  async function locate(url) {
    const canonical = filePath(url)
    try { await access(canonical); return canonical } catch {}
    if (legacyLookup) { const legacy = safeLegacyPath(url); try { await access(legacy); return legacy } catch {} }
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
    async exists(url) { try { await locate(url); return true } catch (error) { if (error instanceof StorageFileNotFoundError) return false; throw error } },
    async stat(url) { return stat(await locate(url)) },
    async delete(url) { await unlink(await locate(url)) },
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
    async checksum(url) { const hash = createHash('sha256'); await pipeline(createReadStream(await locate(url)), hash); return hash.digest('hex') },
    async *list() { yield* [] }
  }
}
