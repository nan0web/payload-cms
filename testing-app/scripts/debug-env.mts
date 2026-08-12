import 'dotenv/config'
console.log('After dotenv/config:', process.env.PAYLOAD_SECRET)
const cfg = await import('./src/payload.config.ts')
console.log('After config import:', process.env.PAYLOAD_SECRET)
const payloadConfig = await cfg.default
console.log('Resolved secret:', payloadConfig.secret?.slice(0, 10))
process.exit(0)
