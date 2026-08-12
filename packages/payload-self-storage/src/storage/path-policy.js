import path from 'node:path'

export class StoragePathError extends Error {
  constructor(message) {
    super(message)
    this.name = 'StoragePathError'
  }
}

function asPath(value) {
  if (typeof value !== 'string' || value.length === 0) throw new StoragePathError('URL must be a non-empty string')
  let parsed
  try { parsed = new URL(value, 'http://storage.local') } catch { throw new StoragePathError('Invalid URL') }
  if (parsed.origin !== 'http://storage.local' && value.startsWith('//')) throw new StoragePathError('Foreign origins are not allowed')
  if (parsed.origin !== 'http://storage.local' && !value.startsWith('/')) throw new StoragePathError('Foreign origins are not allowed')
  const pathname = decodeURIComponent(parsed.pathname)
  if (pathname.split('/').includes('..') || pathname.includes('\\')) throw new StoragePathError('Path traversal is not allowed')
  return pathname
}

export function createPathPolicy({ publicUrlPrefix = '/media' } = {}) {
  const prefix = `/${publicUrlPrefix.replace(/^\/+|\/+$/g, '')}`
  return {
    normalizeUrl(value) {
      const pathname = asPath(value)
      if (!pathname.startsWith(`${prefix}/`) && pathname !== prefix) throw new StoragePathError('URL is outside the public prefix')
      return pathname === prefix ? `${prefix}/` : pathname
    },
    storageKey(value) {
      const pathname = this.normalizeUrl(value)
      return pathname.slice(prefix.length).replace(/^\/+/, '')
    },
    relativeUrl(key) {
      if (typeof key !== 'string' || !key || key.includes('\\') || key.split('/').includes('..')) throw new StoragePathError('Invalid storage key')
      return `${prefix}/${key.replace(/^\/+/, '')}`
    },
    parts(value) {
      const pathname = this.normalizeUrl(value)
      return { uri: path.posix.dirname(pathname), filename: path.posix.basename(pathname), pathname }
    }
  }
}

export function resolvePublicUrl(relativeUrl, publicOrigin) {
  const url = new URL(relativeUrl, publicOrigin || 'http://storage.local')
  return publicOrigin ? url.href : url.pathname
}
