// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  modules: [
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    '@nuxt/eslint'
  ],
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  supabase: {
    url: process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY,
    redirect: false
  },
  css: [
    '~/assets/scss/main.scss'
  ],
  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT || '465',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || '',
    smtpSecure: process.env.SMTP_SECURE || 'true',
    smsRuApiKey: process.env.SMS_RU_API_KEY || '',
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true }
})
