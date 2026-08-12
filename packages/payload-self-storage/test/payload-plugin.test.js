import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { Readable } from 'node:stream'
import os from 'node:os'
import path from 'node:path'
import { payloadSelfStorage } from '../src/index.js'

const roots = []
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))) })

describe('Payload config integration', () => {
  it('adds media lifecycle hooks without importing Payload', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'payload-plugin-')); roots.push(root)
    const redirects = []
    const withStorage = payloadSelfStorage({ rootDir: root, onRedirect: async (redirect) => redirects.push(redirect) })
    const config = withStorage({
      collections: [
        { slug: 'media', hooks: {} },
        { slug: 'users' }
      ]
    })
    const media = config.collections.find((collection) => collection.slug === 'media')
    const users = config.collections.find((collection) => collection.slug === 'users')
    assert.equal(media.upload.staticDir, root)
    assert.equal(media.upload.staticURL, '/media')
    assert.equal(media.upload.formatOptions.format, 'webp')
    assert.equal(media.upload.createParentPath, true)
    assert.deepEqual(media.upload.imageSizes, [])
    assert.equal(media.hooks.beforeOperation, undefined)
    assert.equal(media.hooks.afterChange.length, 1)
    assert.equal(media.hooks.afterDelete.length, 1)
    assert.equal(users.hooks, undefined)

    const createdUrl = '/media/images/cards/created.webp'
    await withStorage.backend.write('/media/created.webp', Readable.from('created'))
    await media.hooks.afterChange[0]({ operation: 'create', doc: { url: createdUrl } })
    assert.equal(await withStorage.backend.exists(createdUrl), true)

    const oldUrl = '/media/cards/visa.webp'
    const newUrl = '/media/archive/visa.webp'
    await withStorage.backend.write(oldUrl, Readable.from('visa'))
    await media.hooks.afterChange[0]({ operation: 'update', previousDoc: { url: oldUrl }, doc: { url: newUrl } })
    assert.equal(await withStorage.backend.exists(oldUrl), false)
    assert.equal(await withStorage.backend.exists(newUrl), true)
    assert.equal(redirects[0].statusCode, 302)

    await media.hooks.afterDelete[0]({ doc: { url: newUrl } })
    assert.equal(await withStorage.backend.exists(newUrl), false)
  })

  it('supports async function and Promise configs correctly', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'payload-plugin-')); roots.push(root)
    const withStorage = payloadSelfStorage({ rootDir: root })
    const promiseConfig = Promise.resolve({ collections: [{ slug: 'media', hooks: {} }] })
    const resolved = await withStorage(promiseConfig)
    assert.ok(resolved.collections)
    assert.equal(resolved.collections[0].upload.staticDir, root)
  })

  it('stores original and image sizes under the Payload folder path as WebP', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'payload-plugin-')); roots.push(root)
    const withStorage = payloadSelfStorage({ rootDir: root })
    const config = withStorage({ collections: [{
      slug: 'media', folders: true, hooks: {}, upload: {
        imageSizes: [{ name: 'thumb', width: 100, formatOptions: { options: { quality: 80 } } }]
      }
    }] })
    const media = config.collections[0]
    const folder = { id: 'child', slug: 'cards', folder: { id: 'parent', slug: 'images', folder: null } }
    const doc = {
      folder,
      filename: 'Visa.webp', url: '/media/Visa.webp', mimeType: 'image/webp',
      sizes: { thumb: { filename: 'Visa- thumb.webp', url: '/media/Visa- thumb.webp', mimeType: 'image/webp' } }
    }
    await withStorage.backend.write('/media/Visa.webp', Readable.from('original'))
    await withStorage.backend.write('/media/Visa- thumb.webp', Readable.from('thumb'))
    const result = await media.hooks.afterChange[0]({ operation: 'create', doc, req: {} })
    assert.equal(await withStorage.backend.exists('/media/images/cards/Visa.webp'), true)
    assert.equal(await withStorage.backend.exists('/media/images/cards/Visa- thumb.webp'), true)
    assert.equal(result.url, '/media/images/cards/Visa.webp')
    assert.equal(result.filename, 'images/cards/Visa.webp')
    assert.equal(result.sizes.thumb.filename, 'images/cards/Visa- thumb.webp')
    assert.equal(result.mimeType, 'image/webp')
    assert.equal(result.sizes.thumb.url, '/media/images/cards/Visa- thumb.webp')
    assert.equal(result.sizes.thumb.mimeType, 'image/webp')
    assert.equal(media.upload.imageSizes[0].formatOptions.format, 'webp')
    assert.equal(media.upload.imageSizes[0].formatOptions.options.quality, 80)
  })

  it('resolves folders using Payload 3.87 name property and req.payload.findByID', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'payload-plugin-')); roots.push(root)
    const withStorage = payloadSelfStorage({ rootDir: root })
    const config = withStorage({ collections: [{ slug: 'media', folders: true, hooks: {} }] })
    const media = config.collections[0]
    const doc = {
      folder: 2026,
      filename: 'mapa.jpg', url: '/media/mapa.jpg', mimeType: 'image/jpeg'
    }
    const req = {
      payload: {
        findByID: async ({ id }) => {
          if (id === 2026) return { id: 2026, name: '2026', folder: null }
          return null
        }
      }
    }
    await withStorage.backend.write('/media/mapa.jpg', Readable.from('mapa-content'))
    const result = await media.hooks.beforeChange[0]({ doc, req })
    assert.equal(await withStorage.backend.exists('/media/2026/mapa.webp'), true)
    assert.equal(result.url, '/media/2026/mapa.webp')
  })
})
