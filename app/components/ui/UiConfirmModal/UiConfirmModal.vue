<template lang="pug">
Teleport(to="body")
  Transition(name="modal")
    .ui-confirm-modal__overlay(v-if="confirmStore.isOpen", @click.self="confirmStore.handleCancel")
      .ui-confirm-modal(:class="`ui-confirm-modal--${confirmStore.options?.variant || 'primary'}`", role="dialog", aria-modal="true")
        .ui-confirm-modal__body
          .ui-confirm-modal__icon-wrapper(:class="`ui-confirm-modal__icon-wrapper--${confirmStore.options?.variant || 'primary'}`")
            Trash2(v-if="confirmStore.options?.icon === 'trash'", :size="24")
            AlertTriangle(v-else-if="confirmStore.options?.icon === 'alert' || confirmStore.options?.variant === 'danger'", :size="24")
            HelpCircle(v-else, :size="24")

          .ui-confirm-modal__content
            h3.ui-confirm-modal__title {{ confirmStore.options?.title || 'Подтверждение' }}
            p.ui-confirm-modal__message {{ confirmStore.options?.message }}

        .ui-confirm-modal__footer
          UiButton(
            variant="secondary",
            size="sm",
            @click="confirmStore.handleCancel"
          ) {{ confirmStore.options?.cancelText || 'Отмена' }}

          UiButton(
            :variant="confirmStore.options?.variant || 'primary'",
            size="sm",
            @click="confirmStore.handleConfirm"
          ) {{ confirmStore.options?.confirmText || 'Подтвердить' }}
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { Trash2, AlertTriangle, HelpCircle } from 'lucide-vue-next'
import { useConfirmStore } from '~/stores/confirm.store'
import UiButton from '~/components/ui/UiButton/UiButton.vue'

const confirmStore = useConfirmStore()

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && confirmStore.isOpen) {
    confirmStore.handleCancel()
  }
}

watch(() => confirmStore.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style lang="scss">
.ui-confirm-modal {
  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    padding: 24px;
  }

  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 440px;
  overflow: hidden;

  &__body {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-4);
    padding: 24px;
  }

  &__icon-wrapper {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;

    &--danger {
      background-color: rgba(239, 68, 68, 0.15);
      color: var(--color-danger);
    }

    &--warning {
      background-color: rgba(245, 158, 11, 0.15);
      color: var(--color-warning);
    }

    &--primary {
      background-color: rgba(59, 130, 246, 0.15);
      color: var(--color-primary);
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 17px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 8px 0;
    line-height: 1.3;
  }

  &__message {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
    word-break: break-word;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-3);
    padding: 16px 24px;
    background-color: rgba(0, 0, 0, 0.15);
    border-top: 1px solid var(--color-border);
  }
}
</style>
