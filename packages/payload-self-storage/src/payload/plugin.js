/**
 * Payload 3.x config plugin for collections using upload fields.
 * Payload remains an optional peer integration: no Payload import is required.
 */
import { createLocalFilesystemBackend } from '../storage/local-backend.js'
import { createRedirect } from '../redirects/redirect-store.js'
import { createReadStream } from 'node:fs'
import { access, copyFile, readdir, stat, symlink, unlink } from 'node:fs/promises'
import path from 'node:path'

const WEBP_MIME_TYPE = 'image/webp'

function folderId(folder) {
  return folder && typeof folder === 'object' ? folder.id : folder
}

async function resolveFolderPath(folder, req) {
  const parts = []
  let current = folder
  const seen = new Set()
  while (current) {
    const id = folderId(current)
    if (id && seen.has(id)) break
    if (id) seen.add(id)
    if (typeof current === 'string' || typeof current === 'number') {
      if (!req?.payload?.findByID) break
      current = await req.payload.findByID({ collection: 'payload-folders', id: current, depth: 0 })
      if (!current) break
    }
    const segment = current.name || current.slug
    if (segment) parts.unshift(segment)
    current = current.folder
  }
  return parts.filter(Boolean).join('/')
}

function fileEntries(doc) {
  return [
    { key: 'original', file: doc },
    ...Object.entries(doc?.sizes || {}).map(([key, file]) => ({ key, file })),
  ].filter(({ file }) => file?.url || file?.filename)
}

function webpMetadata(file, url, publicUrlPrefix) {
  if (!file) return file
  const base = path.basename(file.filename || url, path.extname(file.filename || url))
  const filename = `${base}.webp`
  const dir = path.dirname(url)
  const webpUrl = `${dir}/${filename}`
  // Strip publicUrlPrefix for SSG/server-side rendering.
  // Use startsWith + slice for reliable prefix removal (regex can fail on edge cases).
  const prefix = publicUrlPrefix.endsWith('/') ? publicUrlPrefix : `${publicUrlPrefix}/`
  const serverUrl = webpUrl.startsWith(prefix) ? webpUrl.slice(prefix.length) : webpUrl
  return { ...file, filename: serverUrl, url: webpUrl, serverUrl, mimeType: WEBP_MIME_TYPE }
}

function cleanAltFromFilename(filename) {
  if (!filename) return ''
  const decoded = decodeURIComponent(filename)
  const nameWithoutExt = path.basename(decoded, path.extname(decoded))
  return nameWithoutExt.replace(/[-_]+/g, ' ').trim()
}

async function moveDocumentFiles({ backend, doc, req, publicUrlPrefix, rootDir }) {
  const folderPath = await resolveFolderPath(doc.folder, req)
  const updated = { ...doc, sizes: doc.sizes ? { ...doc.sizes } : doc }
  if (!doc.sizes) delete updated.sizes

  // Auto-fill alt if missing
  const primaryFilename = doc.filename || (doc.url ? path.basename(doc.url) : '')
  if (!updated.alt && primaryFilename) {
    updated.alt = cleanAltFromFilename(primaryFilename)
  }

  for (const { key, file } of fileEntries(doc)) {
    const rawFilename = file.filename || path.basename(file.url || '')
    const base = path.basename(rawFilename, path.extname(rawFilename))
    const oldUrl = file.url || `${publicUrlPrefix}/${rawFilename}`
    const flatUrl = `${publicUrlPrefix}/${path.basename(oldUrl)}`
    const flatWebpUrl = `${publicUrlPrefix}/${base}.webp`
    const folderPrefix = folderPath ? `${publicUrlPrefix}/${folderPath}` : file.url ? path.dirname(file.url) : publicUrlPrefix
    const newUrl = `${folderPrefix}/${base}.webp`

    if (await backend.exists(flatWebpUrl).catch(() => false)) {
      await backend.move(flatWebpUrl, newUrl).catch(() => {})
    } else if (await backend.exists(flatUrl).catch(() => false)) {
      await backend.move(flatUrl, newUrl).catch(() => {})
    } else if (oldUrl !== newUrl && (await backend.exists(oldUrl).catch(() => false))) {
      await backend.move(oldUrl, newUrl).catch(() => {})
    }

    const metadata = webpMetadata(file, newUrl, publicUrlPrefix)
    if (key === 'original') Object.assign(updated, metadata)
    else updated.sizes[key] = metadata
  }
  return updated
}

async function findRecursive(dir, targetBasename) {
  try {
    const decodedTarget = decodeURIComponent(targetBasename)
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const found = await findRecursive(fullPath, decodedTarget)
        if (found) return found
      } else if (entry.name === decodedTarget || entry.name === targetBasename) {
        return fullPath
      }
    }
  } catch {}
  return null
}

async function generateThumbnailOnDemand(rootDir, filename) {
  const decoded = decodeURIComponent(filename)
  const match = decoded.match(/^(.+)-(\d+)x(\d+)\.(webp|png|jpg|jpeg)$/i)
  if (!match) return null
  const [, base, widthStr, heightStr, ext] = match
  const width = parseInt(widthStr, 10)
  const height = parseInt(heightStr, 10)

  let masterPath = await findRecursive(rootDir, `${base}.${ext}`)
  if (!masterPath) {
    for (const altExt of ['webp', 'jpg', 'jpeg', 'png']) {
      masterPath = await findRecursive(rootDir, `${base}.${altExt}`)
      if (masterPath) break
    }
  }
  if (!masterPath) return null

  try {
    const sharpModule = await import('sharp')
    const sharp = sharpModule.default || sharpModule
    const targetPath = path.join(path.dirname(masterPath), decoded)
    await sharp(masterPath).resize(width, height, { fit: 'cover' }).toFile(targetPath)
    return targetPath
  } catch {
    return masterPath
  }
}

// Shared mutable state for upload handlers (set in apply())
let _policy = null
let _rootDir = null

/** Serve an existing file from disk using the full stored URL. */
function respondWithFile(filePath) {
  return async () => {
    try {
      const fileStat = await stat(filePath)
      const stream = createReadStream(filePath)
      const ext = path.extname(filePath).toLowerCase()
      const MIME_TYPES = {
        '.webp': 'image/webp',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
      }
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'
      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileStat.size.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch {
      return new Response('File Not Found', { status: 404 })
    }
  }
}

/**
 * Custom upload handler for on-demand file serving during GET requests.
 * Resolves the file from disk using the full hierarchical URL from the doc,
 * falling back to recursive filesystem search by basename if the exact path doesn't exist.
 */
async function serveUploadFile(_req, context) {
  const { doc, params } = context

  // Strategy 1: Use the specific filename from params to find the file
  // This works for both originals and thumbnails, regardless of what
  // checkFileAccess returned (which may fail due to hierarchical filenames)
  if (params?.filename) {
    const filename = decodeURIComponent(params.filename)

    // First, try to match against doc.sizes if available
    if (doc?.sizes) {
      for (const [, sizeDoc] of Object.entries(doc.sizes)) {
        if (sizeDoc?.url) {
          const urlPath = _policy.storageKey(sizeDoc.url)
          const filePath = path.join(_rootDir, urlPath)
          try {
            await access(filePath)
            return respondWithFile(filePath)()
          } catch {}
        }
      }
    }

    // Try original doc.url
    if (doc?.url) {
      const urlPath = _policy.storageKey(doc.url)
      const filePath = path.join(_rootDir, urlPath)
      try {
        await access(filePath)
        return respondWithFile(filePath)()
      } catch {}
    }

    // Fallback: recursive search by basename
    const foundPath = await findRecursive(_rootDir, filename)
    if (foundPath) {
      return respondWithFile(foundPath)()
    }
  }

  return null
}

async function serveStorageFile(backend, rootDir, reqUrl) {
  try {
    const cleanUrl = decodeURIComponent(reqUrl)
    let filePath
    try {
      filePath = await backend.locate(cleanUrl)
    } catch {
      const rawPath = new URL(reqUrl, 'http://local').pathname
      const filename = decodeURIComponent(path.basename(rawPath))
      filePath = await findRecursive(rootDir, filename)
      if (!filePath) {
        filePath = await generateThumbnailOnDemand(rootDir, filename)
      }
    }
    if (!filePath) return new Response('File Not Found', { status: 404 })

    const fileStat = await stat(filePath)
    const stream = createReadStream(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const MIME_TYPES = {
      '.webp': 'image/webp',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
    }
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStat.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response('File Not Found', { status: 404 })
  }
}

/**
 * @typedef {Object} PayloadSelfStorageOptions
 * @property {string} rootDir
 * @property {string[]} [collections]
 * @property {string} [publicUrlPrefix]
 * @property {string} [publicOrigin]
 * @property {boolean} [legacyLookup]
 * @property {'reject'|'overwrite'} [collision]
 * @property {boolean} [convertImageSizesToWebp]
 * @property {(redirect: object) => Promise<void>} [onRedirect]
 */

/**
 * @param {PayloadSelfStorageOptions} options
 */
export function payloadSelfStorage({
  rootDir,
  collections = ['media'],
  publicUrlPrefix = '/media',
  publicOrigin,
  legacyLookup = true,
  collision = 'reject',
  convertImageSizesToWebp = true,
  onRedirect = async () => {},
} = {}) {
  const backend = createLocalFilesystemBackend({ rootDir, publicUrlPrefix, legacyLookup, collision })
  const cleanPrefix = publicUrlPrefix.replace(/^\/+|\/+$/g, '')
  const withSelfStorage = function withSelfStorage(config) {
    const apply = (resolvedConfig) => {
      // Set shared mutable state for upload handlers
      _policy = backend.policy
      _rootDir = rootDir

      const collectionSet = new Set(collections)
      return {
        ...resolvedConfig,
        collections: (resolvedConfig.collections || []).map((collection) => {
          if (!collectionSet.has(collection.slug)) return collection
          const hooks = collection.hooks || {}
          const uploadConfig = collection.upload || {}
          const filenameCompoundIndex = Array.isArray(uploadConfig.filenameCompoundIndex)
            ? uploadConfig.filenameCompoundIndex
            : ['filename']
          return {
            ...collection,
            upload: {
              ...uploadConfig,
              filenameCompoundIndex,
              staticDir: rootDir,
              staticURL: publicUrlPrefix,
              ...(convertImageSizesToWebp
                ? {
                    formatOptions: { ...(collection.upload?.formatOptions || {}), format: 'webp' },
                    imageSizes: (collection.upload?.imageSizes || []).map((size) => ({
                      ...size,
                      formatOptions: { ...(size.formatOptions || {}), format: 'webp' },
                    })),
                  }
                : {}),
              createParentPath: true,
              handlers: [
                ...(collection.upload?.handlers || []),
                serveUploadFile,
              ],
            },
            hooks: {
              ...hooks,
              beforeChange: [
                ...(hooks.beforeChange || []),
                async ({ doc, req }) => {
                  if (!doc?.filename && !doc?.url) return doc
                  return await moveDocumentFiles({ backend, doc, req, publicUrlPrefix, rootDir })
                },
              ],
              afterDelete: [
                ...(hooks.afterDelete || []),
                async ({ doc }) => {
                  if (doc?.url) await backend.delete(doc.url).catch(() => {})
                },
              ],
              afterChange: [
                ...(hooks.afterChange || []),
                async ({ doc, previousDoc, req }) => {
                  if (!doc?.url && !doc?.filename) return doc
                  const moved = await moveDocumentFiles({ backend, doc, req, publicUrlPrefix, rootDir })
                  if (previousDoc?.url && moved?.url && moved.url !== previousDoc.url) {
                    if (await backend.exists(previousDoc.url).catch(() => false)) {
                      await backend.move(previousDoc.url, moved.url).catch(() => {})
                    }
                    await onRedirect(createRedirect({ from: previousDoc.url, to: moved.url }))
                    if (req?.payload && req.payload.create) {
                      await req.payload.create({
                        collection: 'redirects',
                        data: {
                          from: previousDoc.url,
                          to: { type: 'custom', url: moved.url },
                        },
                      }).catch(() => {})
                    }
                  }
                  return moved
                },
              ],
            },
          }
        }),
      }
    }

    if (typeof config === 'function') {
      return async (...args) => apply(await config(...args))
    }
    if (config && typeof config.then === 'function') {
      return config.then((resolvedConfig) => apply(resolvedConfig))
    }
    return apply(config)
  }
  withSelfStorage.backend = backend
  withSelfStorage.rootDir = rootDir
  return withSelfStorage
}

export const createPayloadStorageAdapter = payloadSelfStorage
