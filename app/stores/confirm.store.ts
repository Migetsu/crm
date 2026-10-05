import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ConfirmDialogOptions } from '~/types/confirm.types'

export const useConfirmStore = defineStore('confirm', () => {
  const isOpen = ref(false)
  const options = ref<ConfirmDialogOptions | null>(null)
  let resolvePromise: ((value: boolean) => void) | null = null

  const confirm = (opts: ConfirmDialogOptions): Promise<boolean> => {
    options.value = {
      title: 'Подтверждение действия',
      confirmText: 'Подтвердить',
      cancelText: 'Отмена',
      variant: 'primary',
      icon: 'help',
      ...opts,
    }
    isOpen.value = true

    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
  }

  const handleConfirm = () => {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(true)
      resolvePromise = null
    }
  }

  const handleCancel = () => {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
  }

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel,
  }
})
