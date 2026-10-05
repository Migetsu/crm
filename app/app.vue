<template lang="pug">
NuxtLayout
  NuxtPage
ClientOnly
  UiToastContainer
  UiConfirmModal
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth.store'
import UiToastContainer from '~/components/ui/UiToast/UiToastContainer.vue'
import UiConfirmModal from '~/components/ui/UiConfirmModal/UiConfirmModal.vue'

const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.user) {
    await authStore.fetchProfile()
  }
})
</script>
