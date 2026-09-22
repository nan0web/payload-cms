import { createMediaRouteHandler } from '@nan0web/payload-self-storage'
import path from 'node:path'

export const GET = createMediaRouteHandler({
	rootDir: path.resolve(process.cwd(), 'storage'),
	publicUrlPrefix: '/media',
})
