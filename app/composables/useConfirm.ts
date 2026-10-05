import { useConfirmStore } from '~/stores/confirm.store'
import type { ConfirmDialogOptions } from '~/types/confirm.types'

export const useConfirm = () => {
  const store = useConfirmStore()
  return {
    confirm: (options: ConfirmDialogOptions) => store.confirm(options),
  }
}
