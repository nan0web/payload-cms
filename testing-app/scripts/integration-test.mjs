/**
 * Integration test: upload an image via Payload local API,
 * verify document JSON, physical storage, WebP conversion, URLs.
 */
import { getPayload } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdir, readdir, stat, writeFile as fsWriteFile } from 'node:fs/promises'
import sharp from 'sharp'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'
import { payloadSelfStorage } from '@nan0web/payload-self-storage'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(dirname, '..', 'storage')

// Minimal Media collection matching src/collections/Media.ts
const Media = {
  slug: 'media',
  folders: true,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [
    { name: 'alt', type: 'text' },
  ],
  upload: {
    staticDir: path.resolve(dirname, '..', 'public', 'media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 300 },
      { name: 'square', width: 500, height: 500 },
      { name: 'small', width: 600 },
      { name: 'medium', width: 900 },
      { name: 'large', width: 1400 },
      { name: 'xlarge', width: 1920 },
      { name: 'og', width: 1200, height: 630, crop: 'center' },
    ],
  },
}

const withStorage = payloadSelfStorage({
  rootDir,
  publicUrlPrefix: '/media',
  publicOrigin: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  collections: ['media'],
})

const config = withStorage(await buildConfig({
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL || '' } }),
  collections: [Media],
  secret: process.env.PAYLOAD_SECRET || 'test-secret',
  sharp,
}))

// Initialize Payload locally (no HTTP server)
const payload = await getPayload({ config })

console.log('=== Payload initialized ===')

// --- Step 1: Upload a test image ---
const testImagePath = path.resolve(dirname, '..', 'public', 'images', 'test-upload.png')

// Create a small test PNG if it doesn't exist
if (!(await fileExists(testImagePath))) {
  console.log('Creating test PNG...')
  const pngBuffer = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 50, g: 100, b: 200 },
    },
  })
    .png()
    .toBuffer()
  await mkdir(path.dirname(testImagePath), { recursive: true })
  await fsWriteFile(testImagePath, pngBuffer)
  console.log(`Test PNG created: ${testImagePath}`)
}

// Upload with folder
console.log('\nUploading test image...')
const uploadedDoc = await payload.create({
  collection: 'media',
  data: {
    alt: 'Test Upload - Self Storage Integration',
  },
  filePath: testImagePath,
  folder: 'Root/images/test-integration',
})

console.log('\n=== Uploaded Document JSON ===')
console.log(JSON.stringify(uploadedDoc, null, 2))

// --- Step 2: Check physical storage structure ---
console.log('\n=== Physical Storage Structure ===')
const storageBase = path.join(rootDir, 'Root', 'images', 'test-integration')
try {
  await printDirectoryTree(storageBase, '')
} catch (e) {
  console.log(`  Directory not found: ${storageBase}`)
  console.log(`  Error: ${e.message}`)
}

// --- Step 3: Verify WebP for original and all sizes ---
console.log('\n=== WebP Verification ===')
const expectedSizes = ['thumbnail', 'square', 'small', 'medium', 'large', 'xlarge', 'og']
let allWebP = true

for (const size of expectedSizes) {
  const sizeData = uploadedDoc.sizes?.[size]
  if (!sizeData) {
    console.log(`  MISSING size: ${size}`)
    allWebP = false
    continue
  }
  const filename = sizeData.filename || ''
  const url = sizeData.url || ''
  const mimeType = sizeData.mimeType || ''
  const isWebP = filename.endsWith('.webp')
  const hasCorrectMime = mimeType === 'image/webp'

  // Check file exists on disk
  const fullPath = path.join(rootDir, ...url.split('/').filter(Boolean))
  const exists = await fileExists(fullPath)

  const status = !exists ? 'MISSING' : !isWebP ? 'NOT_WEBP' : !hasCorrectMime ? 'WRONG_MIME' : 'OK'
  if (status !== 'OK') allWebP = false
  console.log(`  ${size}: ${status} | filename=${filename} | url=${url} | mime=${mimeType}`)
}

// Original file
const origFilename = uploadedDoc.filename || ''
const origUrl = uploadedDoc.url || ''
const origMime = uploadedDoc.mimeType || ''
const origIsWebP = origFilename.endsWith('.webp')
const origFullPath = path.join(rootDir, ...origUrl.split('/').filter(Boolean))
const origExists = await fileExists(origFullPath)
const origStatus = !origExists ? 'MISSING' : !origIsWebP ? 'NOT_WEBP' : !origMime ? 'NO_MIME' : origMime !== 'image/webp' ? 'WRONG_MIME' : 'OK'
if (origStatus !== 'OK') allWebP = false
console.log(`  original: ${origStatus} | filename=${origFilename} | url=${origUrl} | mime=${origMime}`)

// --- Step 4: Verify URL patterns ---
console.log('\n=== URL Verification ===')
console.log(`  original url: ${origUrl}`)
console.log(`  expected pattern: /media/Root/images/test-integration/<name>.webp`)
console.log(`  matches: ${origUrl.includes('/media/Root/images/test-integration/') && origUrl.endsWith('.webp')}`)

for (const size of expectedSizes) {
  const sizeData = uploadedDoc.sizes?.[size]
  if (sizeData) {
    const sizeUrl = sizeData.url || ''
    const matches = sizeUrl.includes('/media/Root/images/test-integration/') && sizeUrl.endsWith('.webp')
    console.log(`  ${size} url: ${sizeUrl} | matches: ${matches}`)
  }
}

// --- Summary ---
console.log('\n=== SUMMARY ===')
console.log(`All sizes WebP: ${allWebP}`)
console.log(`Original WebP: ${origIsWebP}`)
console.log(`Original MIME: ${origMime}`)
console.log(`Folder path preserved: ${origUrl.includes('test-integration')}`)

process.exit(0)

// --- Helpers ---
async function fileExists(p) {
  try { await stat(p); return true } catch { return false }
}

async function printDirectoryTree(dir, prefix) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  const sorted = entries.sort((a, b) => a.name.localeCompare(b.name))
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i]
    const isLast = i === sorted.length - 1
    const connector = isLast ? '└── ' : '├── '
    const childPrefix = isLast ? '     ' : '│    '
    const fullPath = path.join(dir, entry.name)
    const sizeInfo = entry.isFile() ? ` (${(await stat(fullPath)).size} bytes)` : ''
    console.log(`${prefix}${connector}${entry.name}${sizeInfo}`)
    if (entry.isDirectory()) {
      await printDirectoryTree(fullPath, prefix + childPrefix)
    }
  }
}
