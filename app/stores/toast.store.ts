import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ToastItem, ToastOptions, ToastType } from '~/types/toast.types'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastItem[]>([])
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  const remove = (id: string) => {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const clear = () => {
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()
    toasts.value = []
  }

  const add = (type: ToastType, message: string, options?: ToastOptions): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const defaultDuration = type === 'error' || type === 'warning' ? 6000 : 4000
    const duration = options?.duration !== undefined ? options.duration : defaultDuration

    const item: ToastItem = {
      id,
      type,
      title: options?.title,
      message,
      duration,
      createdAt: Date.now(),
    }

    toasts.value.push(item)

    if (duration > 0) {
      const timer = setTimeout(() => {
        remove(id)
      }, duration)
      timers.set(id, timer)
    }

    return id
  }

  const success = (message: string, options?: ToastOptions) => add('success', message, options)
  const error = (message: string, options?: ToastOptions) => add('error', message, options)
  const warning = (message: string, options?: ToastOptions) => add('warning', message, options)
  const info = (message: string, options?: ToastOptions) => add('info', message, options)

  return {
    toasts,
    add,
    remove,
    clear,
    success,
    error,
    warning,
    info,
  }
})
