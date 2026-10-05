<template lang="pug">
.ui-toast(:class="typeClass", role="alert")
  .ui-toast__icon
    CheckCircle2(v-if="toast.type === 'success'", :size="20")
    AlertCircle(v-if="toast.type === 'error'", :size="20")
    AlertTriangle(v-if="toast.type === 'warning'", :size="20")
    Info(v-if="toast.type === 'info'", :size="20")

  .ui-toast__content
    .ui-toast__title(v-if="toast.title") {{ toast.title }}
    .ui-toast__message {{ toast.message }}

  button.ui-toast__close(type="button", aria-label="Закрыть", @click="$emit('close', toast.id)")
    X(:size="16")
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import type { ToastItem } from '~/types/toast.types'

const props = defineProps<{
  toast: ToastItem
}>()

defineEmits<{
  (e: 'close', id: string): void
}>()

const typeClass = computed(() => `ui-toast--${props.toast.type}`)
</script>

<style lang="scss">
.ui-toast {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 280px;
  max-width: 420px;
  pointer-events: auto;
  user-select: none;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 4px;
  }

  &--success {
    &::before { background-color: var(--color-success); }
    .ui-toast__icon { color: var(--color-success); }
  }

  &--error {
    &::before { background-color: var(--color-danger); }
    .ui-toast__icon { color: var(--color-danger); }
  }

  &--warning {
    &::before { background-color: var(--color-warning); }
    .ui-toast__icon { color: var(--color-warning); }
  }

  &--info {
    &::before { background-color: var(--color-primary); }
    .ui-toast__icon { color: var(--color-primary); }
  }

  &__icon {
    flex-shrink: 0;
    margin-top: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 2px;
    line-height: 1.3;
  }

  &__message {
    font-size: 13px;
    line-height: 1.4;
    color: var(--color-text-secondary);
    word-break: break-word;
  }

  &__close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    transition: all 0.15s ease;
    margin-top: -2px;
    margin-right: -4px;

    &:hover {
      background-color: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
  }
}
</style>
