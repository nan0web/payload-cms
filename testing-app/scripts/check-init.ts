import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@/payload.config'

const payloadConfig = await config
const payload = await getPayload({ config: payloadConfig })
console.log('PAYLOAD initialized OK')
console.log('Collections:', payloadConfig.collections?.map(c => c.slug).join(', '))
process.exit(0)
