import { useToastStore } from '~/stores/toast.store'

export const useToast = () => {
  return useToastStore()
}
