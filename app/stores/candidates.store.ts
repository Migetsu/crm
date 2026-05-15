import { defineStore } from 'pinia'
import { ref } from 'vue'
import { CandidatesService } from '~/services/candidates.service'
import type { Candidate, CandidateCreatePayload, CandidateStatus } from '~/types/candidate.types'

export const useCandidatesStore = defineStore('candidates', () => {
  const supabase = useSupabaseClient()
  const service = new CandidatesService(supabase as any)

  const candidates = ref<Candidate[]>([])
  const currentCandidate = ref<Candidate | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')

  const fetchAll = async () => {
    isLoading.value = true
    error.value = null
    try {
      candidates.value = await service.fetchAll()
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
      currentCandidate.value = await service.fetchById(id)
    } catch (e: any) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  const create = async (payload: CandidateCreatePayload): Promise<Candidate | null> => {
    isLoading.value = true
    error.value = null
    try {
      const candidate = await service.create(payload)
      candidates.value.unshift(candidate)
      return candidate
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      isLoading.value = false
    }
  }

  const update = async (id: string, payload: Partial<Candidate>): Promise<boolean> => {
    isLoading.value = true
    error.value = null
    try {
      const updated = await service.update(id, payload)
      const idx = candidates.value.findIndex(c => c.id === id)
      if (idx !== -1) candidates.value[idx] = updated
      if (currentCandidate.value?.id === id) currentCandidate.value = updated
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  const updateStatus = async (id: string, status: CandidateStatus): Promise<boolean> => {
    return update(id, { status })
  }

  const search = async (query: string) => {
    searchQuery.value = query
    isLoading.value = true
    error.value = null
    try {
      candidates.value = await service.search(query)
    } catch (e: any) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  const deleteCandidate = async (id: string): Promise<boolean> => {
    try {
      await service.delete(id)
      candidates.value = candidates.value.filter(c => c.id !== id)
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }

  return {
    candidates,
    currentCandidate,
    isLoading,
    error,
    searchQuery,
    fetchAll,
    fetchById,
    create,
    update,
    updateStatus,
    search,
    deleteCandidate,
  }
})
