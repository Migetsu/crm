import { defineStore } from 'pinia'
import { ref } from 'vue'
import { VacanciesService } from '~/services/vacancies.service'
import type { Vacancy } from '~/types/vacancy.types'
import { getErrorMessage } from '~/utils/error'
import { isAllowedVacancyTitle, type VacancyPreset } from '~/data/vacancy-presets'
import { findVacancyForPreset } from '~/utils/vacancy-preset-match'

export const useVacanciesStore = defineStore('vacancies', () => {
  const supabase = useSupabaseClient()
  const service = new VacanciesService(supabase)

  const vacancies = ref<Vacancy[]>([])
  const currentVacancy = ref<Vacancy | null>(null)
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const error = ref<string | null>(null)

  const fetchAll = async (force = false) => {
    if (!force && isLoaded.value && vacancies.value.length > 0) {
      service.fetchAll().then(res => {
        vacancies.value = res
      }).catch(() => {})
      return
    }
    isLoading.value = true
    error.value = null
    try {
      vacancies.value = await service.fetchAll()
      isLoaded.value = true
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
    } finally {
      isLoading.value = false
    }
  }

  const fetchById = async (id: string) => {
    isLoading.value = true
    error.value = null
    try {
      currentVacancy.value = await service.fetchById(id)
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
    } finally {
      isLoading.value = false
    }
  }

  const fetchOpen = async () => {
    try {
      return await service.fetchOpen()
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
      return []
    }
  }

  const create = async (payload: Omit<Vacancy, 'id' | 'created_at'>): Promise<Vacancy | null> => {
    if (!isAllowedVacancyTitle(payload.title)) {
      error.value = 'Создание произвольных вакансий запрещено. Разрешены только 6 типовых должностей розничной сети.'
      return null
    }

    isLoading.value = true
    error.value = null
    try {
      const vacancy = await service.create(payload)
      vacancies.value.unshift(vacancy)
      return vacancy
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
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
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const toggleOpen = async (id: string, isOpen: boolean): Promise<boolean> => {
    return update(id, { is_open: isOpen })
  }

  // Opens or closes a preset position in one org unit; returns new state or null on failure
  const toggleUnitPreset = async (preset: VacancyPreset, unitId: string): Promise<boolean | null> => {
    const existing = findVacancyForPreset(
      preset,
      vacancies.value.filter(v => v.org_unit_id === unitId),
    )
    if (existing) {
      const target = !existing.is_open
      return (await toggleOpen(existing.id, target)) ? target : null
    }
    const created = await create({
      title: preset.title,
      description: preset.description,
      requirements: preset.requirements,
      responsibilities: preset.responsibilities,
      org_unit_id: unitId,
      is_open: true,
    })
    return created ? true : null
  }

  // Sets preset position open/closed in a specific org unit
  const setUnitPresetOpen = async (preset: VacancyPreset, unitId: string, targetOpen: boolean): Promise<boolean | null> => {
    const existing = findVacancyForPreset(
      preset,
      vacancies.value.filter(v => v.org_unit_id === unitId),
    )
    if (existing) {
      if (existing.is_open === targetOpen) return targetOpen
      return (await toggleOpen(existing.id, targetOpen)) ? targetOpen : null
    }
    if (!targetOpen) return false
    const created = await create({
      title: preset.title,
      description: preset.description,
      requirements: preset.requirements,
      responsibilities: preset.responsibilities,
      org_unit_id: unitId,
      is_open: true,
    })
    return created ? true : null
  }

  // Bulk open or close preset position across an array of org units
  const setAllUnitsPreset = async (preset: VacancyPreset, unitIds: string[], targetOpen: boolean): Promise<boolean> => {
    const results = await Promise.all(unitIds.map(unitId => setUnitPresetOpen(preset, unitId, targetOpen)))
    return results.every(res => res !== null)
  }

  const search = async (query: string) => {
    isLoading.value = true
    error.value = null
    try {
      vacancies.value = await service.search(query)
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
    } finally {
      isLoading.value = false
    }
  }

  return {
    vacancies,
    currentVacancy,
    isLoading,
    isLoaded,
    error,
    fetchAll,
    fetchById,
    fetchOpen,
    create,
    update,
    toggleOpen,
    toggleUnitPreset,
    setUnitPresetOpen,
    setAllUnitsPreset,
    search,
  }
})
