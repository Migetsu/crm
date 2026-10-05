import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useToastStore } from '~/stores/toast.store'

describe('Toast Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  it('initializes with empty toasts', () => {
    const store = useToastStore()
    expect(store.toasts).toEqual([])
  })

  it('adds success toast correctly', () => {
    const store = useToastStore()
    const id = store.success('Кандидат сохранен', { title: 'Успех' })

    expect(store.toasts.length).toBe(1)
    expect(store.toasts[0]).toMatchObject({
      id,
      type: 'success',
      title: 'Успех',
      message: 'Кандидат сохранен',
      duration: 4000,
    })
  })

  it('adds error toast with 6000ms default duration', () => {
    const store = useToastStore()
    store.error('Ошибка сети')

    expect(store.toasts.length).toBe(1)
    expect(store.toasts[0].type).toBe('error')
    expect(store.toasts[0].duration).toBe(6000)
  })

  it('removes toast by id', () => {
    const store = useToastStore()
    const id1 = store.info('Инфо 1')
    const id2 = store.info('Инфо 2')

    expect(store.toasts.length).toBe(2)
    store.remove(id1)
    expect(store.toasts.length).toBe(1)
    expect(store.toasts[0].id).toBe(id2)
  })

  it('auto removes toast after duration timeout', () => {
    const store = useToastStore()
    store.success('Тест автоудаления', { duration: 2000 })

    expect(store.toasts.length).toBe(1)
    vi.advanceTimersByTime(1999)
    expect(store.toasts.length).toBe(1)
    vi.advanceTimersByTime(1)
    expect(store.toasts.length).toBe(0)
  })

  it('clears all toasts and timers', () => {
    const store = useToastStore()
    store.info('Сообщение 1')
    store.warning('Предупреждение 2')

    expect(store.toasts.length).toBe(2)
    store.clear()
    expect(store.toasts.length).toBe(0)
  })
})
