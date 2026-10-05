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
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true }
})
