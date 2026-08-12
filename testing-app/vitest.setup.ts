// Any setup scripts you might need go here

import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({ path: path.resolve(__dirname, '.env'), override: true })
