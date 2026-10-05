import { defineStore } from 'pinia'
import { ref } from 'vue'
import { OrgUnitsService } from '~/services/org-units.service'
import type { OrgUnit } from '~/types/org-unit.types'
import { getErrorMessage } from '~/utils/error'

export const useOrgUnitsStore = defineStore('orgUnits', () => {
  const supabase = useSupabaseClient()
  const service = new OrgUnitsService(supabase)

  const orgUnits = ref<OrgUnit[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchAll = async () => {
    isLoading.value = true
    error.value = null
    try {
      orgUnits.value = await service.fetchAll()
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
    } finally {
      isLoading.value = false
    }
  }

  const create = async (payload: Omit<OrgUnit, 'id' | 'created_at'>): Promise<OrgUnit | null> => {
    isLoading.value = true
    error.value = null
    try {
      const unit = await service.create(payload)
      orgUnits.value.push(unit)
      return unit
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const update = async (id: string, payload: Partial<OrgUnit>): Promise<boolean> => {
    isLoading.value = true
    error.value = null
    try {
      const updated = await service.update(id, payload)
      const idx = orgUnits.value.findIndex(u => u.id === id)
      if (idx !== -1) orgUnits.value[idx] = updated
      return true
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const search = async (query: string) => {
    isLoading.value = true
    error.value = null
    try {
      orgUnits.value = await service.search(query)
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
    } finally {
      isLoading.value = false
    }
  }

  return {
    orgUnits,
    isLoading,
    error,
    fetchAll,
    create,
    update,
    search,
  }
})
