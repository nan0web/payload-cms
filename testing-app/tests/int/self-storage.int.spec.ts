import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, expect, afterAll } from 'vitest'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdir, readdir, stat, writeFile as fsWriteFile } from 'node:fs/promises'
import sharp from 'sharp'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(dirname, '..', '..', 'storage')

let payload: any

describe('self-storage integration', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('uploads image with folders:true and verifies storage', async () => {
    // Create test PNG
    const testImagePath = path.resolve(dirname, '..', 'public', 'images', 'test-upload.png')
    if (!(await fileExists(testImagePath))) {
      const pngBuffer = await sharp({
        create: { width: 800, height: 600, channels: 3, background: { r: 50, g: 100, b: 200 } },
      }).png().toBuffer()
      await mkdir(path.dirname(testImagePath), { recursive: true })
      await fsWriteFile(testImagePath, pngBuffer)
    }

    // Helper to get or create folder
    async function getOrCreateFolder(name: string, parentId?: any) {
      const existing = await payload.find({
        collection: 'payload-folders',
        where: {
          name: { equals: name },
          ...(parentId ? { folder: { equals: parentId } } : {}),
        },
      })
      if (existing.docs.length > 0) return existing.docs[0]
      return await payload.create({
        collection: 'payload-folders',
        data: { name, ...(parentId ? { folder: parentId } : {}) },
      })
    }

    // Create or reuse folder structure in payload-folders
    const rootFolder = await getOrCreateFolder('Root')
    const imagesFolder = await getOrCreateFolder('images', rootFolder.id)
    const targetFolder = await getOrCreateFolder('test-integration', imagesFolder.id)

    // Upload with folder ID
    const rawBuffer = await import('node:fs/promises').then(fs => fs.readFile(testImagePath))
    const doc = await payload.create({
      collection: 'media',
      data: {
        alt: 'Test Upload - Self Storage Integration',
        folder: targetFolder.id,
      },
      file: {
        data: new Uint8Array(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength),
        name: 'test-upload.png',
        mimetype: 'image/png',
        size: rawBuffer.length,
      },
    })

    console.log('\n=== Document JSON ===')
    console.log(JSON.stringify(doc, null, 2))

    // Verify original
    expect(doc.filename).toBeDefined()
    expect(doc.filename).toMatch(/\.webp$/)
    expect(doc.mimeType).toBe('image/webp')
    expect(doc.url).toContain('/media/Root/images/test-integration/')
    expect(doc.url).toMatch(/\.webp$/)

    // Verify all sizes
    const expectedSizes = ['thumbnail', 'square', 'small', 'medium', 'large', 'xlarge', 'og']
    for (const size of expectedSizes) {
      const sizeData = doc.sizes?.[size]
      expect(sizeData, `${size} size missing`).toBeDefined()
      if (sizeData && sizeData.filename) {
        expect(sizeData.filename, `${size} filename`).toMatch(/\.webp$/)
        expect(sizeData.mimeType, `${size} mimeType`).toBe('image/webp')
        expect(sizeData.url, `${size} url webp`).toMatch(/\.webp$/)

        // Physical file exists
        const fullPath = path.join(rootDir, sizeData.serverUrl)
        expect(await fileExists(fullPath), `${size} physical file`).toBe(true)
      }
    }

    // Original physical file
    const origFullPath = path.join(rootDir, doc.serverUrl)
    expect(await fileExists(origFullPath), 'original physical file').toBe(true)

    // Directory tree
    const storageBase = path.join(rootDir, 'Root', 'images', 'test-integration')
    const entries = await readdir(storageBase, { withFileTypes: true })
    const filenames = entries.map(e => e.name).sort()
    console.log('\n=== Storage files ===')
    console.log(filenames)

    // Count .webp files for this document
    const baseName = path.basename(doc.filename, '.webp')
    const docWebpFiles = filenames.filter(f => f.startsWith(baseName) && f.endsWith('.webp'))
    expect(docWebpFiles.length, 'webp files for document (1 original + 3 sizes)').toBe(4)

    // Cleanup
    await payload.delete({ collection: 'media', id: doc.id })
  })
})

async function fileExists(p: string) {
  try { await stat(p); return true } catch { return false }
}
