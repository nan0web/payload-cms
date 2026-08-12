import { postgresAdapter } from '@payloadcms/db-postgres'
import sharp from 'sharp'
import { buildConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import { payloadSelfStorage } from '@nan0web/payload-self-storage'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(dirname, '..', 'storage')
const publicUrlPrefix = '/media'
const publicOrigin = 'http://localhost:3000'

// Minimal Media collection matching src/collections/Media.ts
const Media = {
  slug: 'media',
  folders: true,
  fields: [
    { name: 'alt', type: 'text' },
    { name: 'caption', type: 'richText' },
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
  publicUrlPrefix,
  publicOrigin,
  collections: ['media'],
})

const config = withStorage({
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL || '' } }),
  collections: [Media],
  secret: process.env.PAYLOAD_SECRET || 'test',
  sharp,
})

// Resolve the config (it might be a function)
const resolved = typeof config === 'function' ? await config() : config

const mediaCollection = resolved.collections?.find(c => c.slug === 'media')
console.log('=== Resolved Media Collection ===')
console.log('slug:', mediaCollection?.slug)
console.log('folders:', mediaCollection?.folders)
console.log('upload.staticDir:', mediaCollection?.upload?.staticDir)
console.log('upload.staticURL:', mediaCollection?.upload?.staticURL)
console.log('upload.createParentPath:', mediaCollection?.upload?.createParentPath)
console.log('upload.formatOptions:', JSON.stringify(mediaCollection?.upload?.formatOptions))
console.log('imageSizes:')
for (const size of mediaCollection?.upload?.imageSizes || []) {
  console.log(`  - ${size.name}: ${size.width}x${size.height || '-'} formatOptions:`, JSON.stringify(size.formatOptions))
}
console.log('hooks.beforeChange count:', (mediaCollection?.hooks?.beforeChange || []).length)
console.log('hooks.afterChange count:', (mediaCollection?.hooks?.afterChange || []).length)
console.log('hooks.afterDelete count:', (mediaCollection?.hooks?.afterDelete || []).length)
console.log('endpoints count:', resolved.endpoints?.length)
console.log('=== END ===')
