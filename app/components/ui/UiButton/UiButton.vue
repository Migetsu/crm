<template lang="pug">
button.ui-button(:class="classes", :disabled="disabled", @click="$emit('click', $event)")
  span.ui-button__icon(v-if="$slots.icon")
    slot(name="icon")
  span.ui-button__text
    slot
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}>()

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const classes = computed(() => {
  return [
    `ui-button--${props.variant || 'primary'}`,
    `ui-button--${props.size || 'md'}`
  ]
})
</script>

<style lang="scss">
@use '~/assets/scss/variables' as *;

.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all 0.2s ease;
  
  &--sm {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: 14px;
  }
  
  &--md {
    padding: var(--spacing-3) var(--spacing-4);
    font-size: 16px;
  }
  
  &--lg {
    padding: var(--spacing-4) var(--spacing-6);
    font-size: 18px;
  }
  
  &--primary {
    background-color: var(--color-primary);
    color: white;
    
    &:hover:not(:disabled) {
      background-color: var(--color-primary-hover);
    }
  }
  
  &--secondary {
    background-color: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    
    &:hover:not(:disabled) {
      background-color: var(--color-bg-surface-hover);
    }
  }
  
  &--ghost {
    color: var(--color-text-secondary);
    
    &:hover:not(:disabled) {
      background-color: var(--color-bg-surface-hover);
      color: var(--color-text-primary);
    }
  }
  
  &--danger {
    background-color: var(--color-danger);
    color: white;
    
    &:hover:not(:disabled) {
      opacity: 0.9;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
