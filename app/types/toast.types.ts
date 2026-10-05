export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  title?: string
  duration?: number
}

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
  duration: number
  createdAt: number
}
