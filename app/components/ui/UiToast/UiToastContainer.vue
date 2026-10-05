<template lang="pug">
Teleport(to="body")
  .ui-toast-container(aria-live="polite", aria-atomic="true")
    TransitionGroup(name="toast-list", tag="div", class="ui-toast-container__list")
      UiToast(
        v-for="toast in toastStore.toasts",
        :key="toast.id",
        :toast="toast",
        @close="toastStore.remove"
      )
</template>

<script setup lang="ts">
import { useToastStore } from '~/stores/toast.store'
import UiToast from './UiToast.vue'

const toastStore = useToastStore()
</script>

<style lang="scss">
.ui-toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 99999;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  width: auto;

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }
}

.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}

.toast-list-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}

.toast-list-move {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
