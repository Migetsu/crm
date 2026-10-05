import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Profile, UserRole } from '~/types/user.types'
import { getErrorMessage } from '~/utils/error'

interface CreateUserPayload {
  email: string
  password: string
  fullName: string
  role: UserRole
}

export const useUsersStore = defineStore('users', () => {
  const supabase = useSupabaseClient()
  const users = ref<Profile[]>([])
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const error = ref<string | null>(null)

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      return token ? { Authorization: `Bearer ${token}` } : {}
    } catch {
      return {}
    }
  }

  const fetchAll = async (force = false) => {
    if (!force && isLoaded.value && users.value.length > 0) {
      supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) users.value = data as Profile[]
        })
        .catch(() => {})
      return
    }
    isLoading.value = true
    error.value = null
    try {
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr
      users.value = (data || []) as Profile[]
      isLoaded.value = true
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
    } finally {
      isLoading.value = false
    }
  }

  const createUser = async (payload: CreateUserPayload): Promise<Profile | null> => {
    isLoading.value = true
    error.value = null
    try {
      const headers = await getAuthHeaders()
      const response = await $fetch<{ success: boolean; profile: Profile }>('/api/admin/create-user', {
        method: 'POST',
        headers,
        body: payload,
      })

      if (response?.profile) {
        users.value.unshift(response.profile)
        return response.profile
      }
      return null
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const updateRole = async (userId: string, role: UserRole): Promise<boolean> => {
    isLoading.value = true
    error.value = null
    try {
      const headers = await getAuthHeaders()
      const response = await $fetch<{ success: boolean; profile: Profile }>('/api/admin/update-user', {
        method: 'POST',
        headers,
        body: { userId, role },
      })

      if (response?.profile) {
        const idx = users.value.findIndex(u => u.id === userId)
        if (idx !== -1) {
          users.value[idx] = response.profile
        }
        return true
      }
      return false
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const toggleActive = async (userId: string, isActive: boolean): Promise<boolean> => {
    isLoading.value = true
    error.value = null
    try {
      const headers = await getAuthHeaders()
      const response = await $fetch<{ success: boolean; profile: Profile }>('/api/admin/update-user', {
        method: 'POST',
        headers,
        body: { userId, isActive },
      })

      if (response?.profile) {
        const idx = users.value.findIndex(u => u.id === userId)
        if (idx !== -1) {
          users.value[idx] = response.profile
        }
        return true
      }
      return false
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const deleteUser = async (userId: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null
    try {
      const headers = await getAuthHeaders()
      const response = await $fetch<{ success: boolean; userId: string }>('/api/admin/delete-user', {
        method: 'POST',
        headers,
        body: { userId },
      })

      if (response?.success) {
        users.value = users.value.filter(u => u.id !== userId)
        return true
      }
      return false
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  return {
    users,
    isLoading,
    isLoaded,
    error,
    fetchAll,
    createUser,
    updateRole,
    toggleActive,
    deleteUser,
  }
})
