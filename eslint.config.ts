import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    files: ['**/*.vue'],
    rules: {
      // Due to pug templates, vue-eslint-parser cannot inspect bindings in <template lang="pug">
      '@typescript-eslint/no-unused-vars': 'off'
    }
  }
)
