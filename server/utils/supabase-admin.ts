import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

let cachedEnvKey: string | null = null
let cachedEnvUrl: string | null = null

const readEnvFallback = () => {
  if (cachedEnvKey && cachedEnvUrl) return { url: cachedEnvUrl, key: cachedEnvKey }
  try {
    const envPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      const keyMatch = content.match(/^SUPABASE_SERVICE_ROLE_KEY=(.*)$/m)
      const urlMatch = content.match(/^SUPABASE_URL=(.*)$/m)
      if (keyMatch) cachedEnvKey = keyMatch[1].trim()
      if (urlMatch) cachedEnvUrl = urlMatch[1].trim()
    }
  } catch {
    // ignore
  }
  return { url: cachedEnvUrl, key: cachedEnvKey }
}

/**
 * Returns a Supabase client with admin (service_role) privileges.
 */
export const getSupabaseAdminClient = () => {
  const config = useRuntimeConfig()
  const envFallback = readEnvFallback()
  const url = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || envFallback.url
  const serviceRoleKey = (config.supabaseServiceRoleKey as string | undefined) || process.env.SUPABASE_SERVICE_ROLE_KEY || envFallback.key

  if (!url || !serviceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase service_role credentials are not configured',
    })
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
