import { defineStore } from 'pinia'
import { ref } from 'vue'
import { VacanciesService } from '~/services/vacancies.service'
import type { Vacancy } from '~/types/vacancy.types'

export const useVacanciesStore = defineStore('vacancies', () => {
  const supabase = useSupabaseClient()
  const service = new VacanciesService(supabase as any)

  const vacancies = ref<Vacancy[]>([])
  const currentVacancy = ref<Vacancy | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchAll = async () => {
    isLoading.value = true
    error.value = null
    try {
      vacancies.value = await service.fetchAll()
    } catch (e: any) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  const fetchById = async (id: string) => {
    isLoading.value = true
    error.value = null
    try {
      currentVacancy.value = await service.fetchById(id)
    } catch (e: any) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  const fetchOpen = async () => {
    try {
      return await service.fetchOpen()
    } catch (e: any) {
      error.value = e.message
      return []
    }
  }

  const create = async (payload: Omit<Vacancy, 'id' | 'created_at'>): Promise<Vacancy | null> => {
    isLoading.value = true
    error.value = null
    try {
      const vacancy = await service.create(payload)
      vacancies.value.unshift(vacancy)
      return vacancy
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      isLoading.value = false
    }
  }

  const update = async (id: string, payload: Partial<Vacancy>): Promise<boolean> => {
    isLoading.value = true
    error.value = null
    try {
      const updated = await service.update(id, payload)
      const idx = vacancies.value.findIndex(v => v.id === id)
      if (idx !== -1) vacancies.value[idx] = updated
      if (currentVacancy.value?.id === id) currentVacancy.value = updated
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  const toggleOpen = async (id: string, isOpen: boolean): Promise<boolean> => {
    return update(id, { is_open: isOpen })
  }

  const search = async (query: string) => {
    isLoading.value = true
    error.value = null
    try {
      vacancies.value = await service.search(query)
    } catch (e: any) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  return {
    vacancies,
    currentVacancy,
    isLoading,
    error,
    fetchAll,
    fetchById,
    fetchOpen,
    create,
    update,
    toggleOpen,
    search,
  }
})
