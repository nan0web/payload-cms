import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import { rm, stat } from 'node:fs/promises'
import path from 'node:path'

async function cleanup() {
  console.log('Initializing Payload...')
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // 1. Delete test-upload media documents and physical files
  const mediaDocs = await payload.find({
    collection: 'media',
    where: {
      filename: { contains: 'test-upload' },
    },
    limit: 100,
  })

  console.log(`Found ${mediaDocs.docs.length} test media documents to delete.`)
  for (const doc of mediaDocs.docs) {
    await payload.delete({ collection: 'media', id: doc.id })
    console.log(`Deleted media doc ID ${doc.id} (${doc.filename})`)
  }

  // 2. Clean up test physical files in storage
  const storageDir = path.resolve(process.cwd(), 'storage', 'Root', 'images', 'test-integration')
  try {
    if (await stat(storageDir).then(() => true).catch(() => false)) {
      await rm(storageDir, { recursive: true, force: true })
      console.log(`Removed storage directory ${storageDir}`)
    }
  } catch (err) {
    console.error('Error removing storageDir:', err)
  }

  // 3. Deduplicate payload-folders
  const allFolders = await payload.find({
    collection: 'payload-folders',
    limit: 500,
  })

  const seen = new Map<string, any>()
  const duplicateIds: (number | string)[] = []

  for (const folder of allFolders.docs) {
    const parentId = typeof folder.folder === 'object' ? folder.folder?.id : folder.folder
    const key = `${folder.name}::${parentId || 'root'}`
    if (seen.has(key)) {
      duplicateIds.push(folder.id)
    } else {
      seen.set(key, folder.id)
    }
  }

  console.log(`Found ${duplicateIds.length} duplicate folder entries to clean up.`)
  for (const id of duplicateIds) {
    await payload.delete({ collection: 'payload-folders', id }).catch(() => {})
    console.log(`Deleted duplicate folder ID ${id}`)
  }

  console.log('Cleanup completed successfully!')
  process.exit(0)
}

cleanup().catch((err) => {
  console.error('Cleanup failed:', err)
  process.exit(1)
})
