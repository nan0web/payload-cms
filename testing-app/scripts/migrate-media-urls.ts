import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@/payload.config'
import path from 'node:path'
import { readdir, stat } from 'node:fs/promises'

const payloadConfig = await config
const payload = await getPayload({ config: payloadConfig })

const rootDir = path.resolve(process.cwd(), 'storage')

console.log('🔍 Scanning filesystem and updating media URLs...')

const docs = await payload.find({
  collection: 'media',
  depth: 1,
  pagination: false,
})

let updated = 0
let skipped = 0
let errors = 0

for (const doc of docs.docs) {
  if (!doc?.url && !doc?.sizes) {
    skipped++
    continue
  }

  try {
    const updates: Record<string, any> = {}

    // Update original URL
    if (doc.url) {
      const actualPath = await findFileOnDisk(rootDir, doc.url)
      if (actualPath) {
        const relativePath = path.relative(rootDir, actualPath)
        updates.url = `/media/${relativePath}`
      }
    }

    // Update sizes
    if (doc.sizes && typeof doc.sizes === 'object') {
      const sizeUpdates: Record<string, any> = {}
      for (const [key, size] of Object.entries(doc.sizes)) {
        if (size && typeof size === 'object' && 'url' in size && (size as any).url) {
          const actualPath = await findFileOnDisk(rootDir, (size as any).url)
          if (actualPath) {
            const relativePath = path.relative(rootDir, actualPath)
            sizeUpdates[key] = { ...size, url: `/media/${relativePath}` }
          }
        }
      }
      if (Object.keys(sizeUpdates).length > 0) {
        updates.sizes = sizeUpdates
      }
    }

    if (Object.keys(updates).length > 0) {
      await payload.update({
        collection: 'media',
        id: doc.id,
        data: updates,
        draft: false,
      })
      updated++
    } else {
      skipped++
    }
  } catch (err) {
    console.error(`❌ Failed to update doc ${doc.id}:`, err.message)
    errors++
  }
}

/**
 * Find a file on disk, handling:
 * - Hierarchical paths (files already moved by plugin)
 * - Extension mismatches (originals converted to .webp, DB still has .jpg/.png)
 */
async function findFileOnDisk(rootDir: string, url: string): Promise<string | null> {
  // Try exact path first
  const relativePath = url.replace(/^\/media\//, '')
  const exactPath = path.join(rootDir, relativePath)
  try {
    await stat(exactPath)
    return exactPath
  } catch {
    // Not found at exact path — try recursive search with extension fallback
    const basename = path.basename(url)
    const nameWithoutExt = path.basename(basename, path.extname(basename))
    const ext = path.extname(basename).toLowerCase()

    // Try exact basename first
    const found = await findRecursive(rootDir, basename)
    if (found) return found

    // Try with different extensions (handles .webp conversion)
    for (const altExt of ['.webp', '.jpg', '.jpeg', '.png']) {
      if (altExt === ext) continue
      const altBasename = `${nameWithoutExt}${altExt}`
      const altFound = await findRecursive(rootDir, altBasename)
      if (altFound) return altFound
    }
  }
  return null
}

async function findRecursive(dir: string, targetBasename: string): Promise<string | null> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const found = await findRecursive(fullPath, targetBasename)
        if (found) return found
      } else if (entry.name === targetBasename) {
        return fullPath
      }
    }
  } catch {
    // Directory not accessible
  }
  return null
}

console.log(`✅ Migration complete: ${updated} updated, ${skipped} skipped, ${errors} errors`)
process.exit(0)
