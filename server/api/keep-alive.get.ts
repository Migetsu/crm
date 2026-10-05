export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabase.url
  const supabaseKey = config.public.supabase.key

  if (!supabaseUrl || !supabaseKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase credentials missing in runtime config',
    })
  }

  const pingUrl = `${supabaseUrl}/rest/v1/profiles?select=id&limit=1`

  try {
    const data = await $fetch(pingUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Supabase database is active',
      result: data,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown ping error'
    throw createError({
      statusCode: 502,
      statusMessage: `Keep-alive ping failed: ${message}`,
    })
  }
})
