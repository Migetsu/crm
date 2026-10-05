import { defineStore } from 'pinia'
import { ref } from 'vue'
import { OrgUnitsService } from '~/services/org-units.service'
import type { OrgUnit, OrgUnitManager } from '~/types/org-unit.types'
import { getErrorMessage } from '~/utils/error'

export const useOrgUnitsStore = defineStore('orgUnits', () => {
  const supabase = useSupabaseClient()
  const service = new OrgUnitsService(supabase)

  const orgUnits = ref<OrgUnit[]>([])
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const error = ref<string | null>(null)

  const fetchAll = async (force = false) => {
    if (!force && isLoaded.value && orgUnits.value.length > 0) {
      service.fetchAll().then(res => {
        orgUnits.value = res
      }).catch(() => {})
      return
    }
    isLoading.value = true
    error.value = null
    try {
      orgUnits.value = await service.fetchAll()
      isLoaded.value = true
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

  const addManager = async (manager: Omit<OrgUnitManager, 'id'>): Promise<OrgUnitManager | null> => {
    isLoading.value = true
    error.value = null
    try {
      const created = await service.addManager(manager)
      const unit = orgUnits.value.find(u => u.id === manager.org_unit_id)
      if (unit) {
        if (!unit.managers) unit.managers = []
        unit.managers.push(created)
      }
      return created
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const removeManager = async (orgUnitId: string, managerId: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null
    try {
      await service.removeManager(managerId)
      const unit = orgUnits.value.find(u => u.id === orgUnitId)
      if (unit && unit.managers) {
        unit.managers = unit.managers.filter(m => m.id !== managerId)
      }
      return true
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    orgUnits,
    isLoading,
    isLoaded,
    error,
    fetchAll,
    create,
    update,
    search,
    addManager,
    removeManager,
  }
})
