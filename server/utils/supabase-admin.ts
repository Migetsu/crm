import { createClient } from '@supabase/supabase-js'

/**
 * Returns a Supabase client with admin (service_role) privileges.
 */
export const getSupabaseAdminClient = () => {
  const config = useRuntimeConfig()
  const url = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

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
