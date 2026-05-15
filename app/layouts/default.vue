<template lang="pug">
.app-layout
  AppSidebar
  .app-layout__main
    AppHeader
    main.app-layout__content
      slot
</template>

<script setup lang="ts">
// Nuxt auto-imports AppSidebar and AppHeader from components/layout/
</script>

<style lang="scss">
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-bg-body);
  color: var(--color-text-primary);
  
  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  
  &__content {
    flex: 1;
    padding: var(--spacing-6);
    overflow-y: auto;
  }
}
</style>
