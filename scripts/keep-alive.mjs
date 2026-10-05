import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env if present in root
const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL || 'https://miirdirlerdmkjxdmrqx.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY

if (!supabaseKey) {
  console.error('[Supabase Keep-Alive] Error: SUPABASE_KEY is missing.')
  process.exit(1)
}

async function pingDatabase() {
  const pingUrl = `${supabaseUrl}/rest/v1/profiles?select=id&limit=1`
  console.log(`[${new Date().toISOString()}] Sending keep-alive query to Supabase: ${pingUrl}`)

  try {
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errText}`)
    }

    const data = await response.json()
    console.log(`[${new Date().toISOString()}] Keep-alive successful! Query executed against database. Response:`, data)
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Keep-alive ping failed:`, err)
    process.exit(1)
  }
}

pingDatabase()
