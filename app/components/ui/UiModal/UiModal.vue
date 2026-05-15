<template lang="pug">
Teleport(to="body")
  Transition(name="modal")
    .ui-modal__overlay(v-if="modelValue", @click.self="close")
      .ui-modal(:class="sizeClass")
        .ui-modal__header
          h2.ui-modal__title {{ title }}
          button.ui-modal__close(@click="close")
            X(:size="20")
        .ui-modal__body
          slot
        .ui-modal__footer(v-if="$slots.footer")
          slot(name="footer")
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  title: string
  size?: 'sm' | 'md' | 'lg'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const sizeClass = computed(() => `ui-modal--${props.size || 'md'}`)

const close = () => {
  emit('update:modelValue', false)
}

const handleEsc = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) close()
}

watch(() => props.modelValue, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => document.addEventListener('keydown', handleEsc))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEsc)
  document.body.style.overflow = ''
})
</script>

<style lang="scss">
.ui-modal {
  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 24px;
  }
  
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  
  &--sm { width: 100%; max-width: 420px; }
  &--md { width: 100%; max-width: 600px; }
  &--lg { width: 100%; max-width: 800px; }
  
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border);
  }
  
  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  
  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    transition: all 0.2s;
    
    &:hover {
      background-color: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
  }
  
  &__body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  }
  
  &__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
  
  .ui-modal {
    transition: transform 0.2s, opacity 0.2s;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  
  .ui-modal {
    transform: scale(0.95) translateY(10px);
    opacity: 0;
  }
}
</style>
