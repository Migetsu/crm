import { defineStore } from 'pinia'
import { ref } from 'vue'
import { TemplatesService } from '~/services/templates.service'
import type { Template, TemplateType } from '~/types/template.types'

export const useTemplatesStore = defineStore('templates', () => {
  const supabase = useSupabaseClient()
  const service = new TemplatesService(supabase as any)

  const templates = ref<Template[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchByType = async (type: TemplateType) => {
    isLoading.value = true
    error.value = null
    try {
      templates.value = await service.fetchByType(type)
    } catch (e: any) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  const update = async (id: string, payload: Partial<Template>): Promise<boolean> => {
    isLoading.value = true
    error.value = null
    try {
      const updated = await service.update(id, payload)
      const idx = templates.value.findIndex(t => t.id === id)
      if (idx !== -1) templates.value[idx] = updated
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  const create = async (payload: Omit<Template, 'id' | 'created_at'>): Promise<Template | null> => {
    isLoading.value = true
    error.value = null
    try {
      const tmpl = await service.create(payload)
      templates.value.unshift(tmpl)
      return tmpl
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      isLoading.value = false
    }
  }

  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      await service.delete(id)
      templates.value = templates.value.filter(t => t.id !== id)
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  return {
    templates,
    isLoading,
    error,
    fetchByType,
    update,
    create,
    deleteTemplate,
  }
})
