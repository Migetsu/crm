export type ConfirmVariant = 'danger' | 'warning' | 'primary'

export interface ConfirmDialogOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  icon?: 'trash' | 'alert' | 'help'
}
