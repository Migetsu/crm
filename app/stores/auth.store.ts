import { defineStore } from 'pinia'
import { ref } from 'vue'
import { AuthService } from '~/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const profile = ref<Record<string, any> | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  const authService = new AuthService(supabase)

  const login = async (email: string, password: string) => {
    isLoading.value = true
    error.value = null
    try {
      await authService.login(email, password)
      if (user.value) {
        await fetchProfile()
      }
    } catch (e: unknown) {
      const err = e as Error
      error.value = err.message || 'Ошибка авторизации'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    try {
      await authService.logout()
      profile.value = null
    } catch (e: unknown) {
      console.error(e)
    } finally {
      isLoading.value = false
    }
  }

  const fetchProfile = async () => {
    if (!user.value) return
    try {
      const data = await authService.getProfile(user.value.id)
      profile.value = data
      
      if (data.theme && import.meta.client) {
        document.documentElement.setAttribute('data-theme', data.theme)
      }
    } catch (e: unknown) {
      console.error('Ошибка получения профиля:', e)
    }
  }

  const updateProfile = async (updates: any) => {
    if (!user.value) return
    try {
      const data = await authService.updateProfile(user.value.id, updates)
      profile.value = data
      
      if (updates.theme && import.meta.client) {
        document.documentElement.setAttribute('data-theme', updates.theme)
      }
    } catch (e: unknown) {
      console.error('Ошибка обновления профиля:', e)
      throw e
    }
  }

  const toggleTheme = async () => {
    const currentTheme = profile.value?.theme || 'light'
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    await updateProfile({ theme: newTheme })
  }

  return {
    user,
    profile,
    isLoading,
    error,
    login,
    logout,
    fetchProfile,
    updateProfile,
    toggleTheme
  }
})
