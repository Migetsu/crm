import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConfirmStore } from '~/stores/confirm.store'

describe('Confirm Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes in closed state', () => {
    const store = useConfirmStore()
    expect(store.isOpen).toBe(false)
    expect(store.options).toBeNull()
  })

  it('opens modal with options and returns promise', async () => {
    const store = useConfirmStore()
    const promise = store.confirm({
      title: 'Удалить запись?',
      message: 'Вы уверены?',
      variant: 'danger',
    })

    expect(store.isOpen).toBe(true)
    expect(store.options?.title).toBe('Удалить запись?')
    expect(store.options?.variant).toBe('danger')

    // Confirm action
    store.handleConfirm()
    const result = await promise

    expect(result).toBe(true)
    expect(store.isOpen).toBe(false)
  })

  it('resolves false on cancel', async () => {
    const store = useConfirmStore()
    const promise = store.confirm({
      message: 'Вы уверены?',
    })

    expect(store.isOpen).toBe(true)

    // Cancel action
    store.handleCancel()
    const result = await promise

    expect(result).toBe(false)
    expect(store.isOpen).toBe(false)
  })
})
