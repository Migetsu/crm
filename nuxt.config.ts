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
    redirect: false
  },
  css: [
    '~/assets/scss/main.scss'
  ],
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true }
})
