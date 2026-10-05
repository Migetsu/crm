import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { CandidatesService } from '~/services/candidates.service'
import type {
  Candidate,
  CandidateCreatePayload,
  CandidateStatus,
  CandidateFilterParams,
  CandidateViewMode,
} from '~/types/candidate.types'
import { getErrorMessage } from '~/utils/error'

export const useCandidatesStore = defineStore('candidates', () => {
  const supabase = useSupabaseClient()
  const service = new CandidatesService(supabase)

  const candidates = ref<Candidate[]>([])
  const allCandidatesForKanban = ref<Candidate[]>([])
  const currentCandidate = ref<Candidate | null>(null)
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const error = ref<string | null>(null)

  // View mode
  const viewMode = ref<CandidateViewMode>('list')

  // Pagination
  const page = ref(1)
  const pageSize = ref(10)
  const totalCount = ref(0)
  const totalPages = ref(1)

  // Filters
  const filters = reactive<CandidateFilterParams>({
    searchQuery: '',
    vacancyId: null,
    status: 'all',
    source: 'all',
    datePeriod: 'all',
    sortBy: 'created_at_desc',
  })

  // Grouped candidates for Kanban
  const kanbanColumns = computed(() => {
    const groups: Record<CandidateStatus, Candidate[]> = {
      new: [],
      no_feedback: [],
      interview_scheduled: [],
      reserve: [],
      rejected: [],
      self_rejected: [],
    }

    const sourceList = viewMode.value === 'kanban' ? allCandidatesForKanban.value : candidates.value

    for (const c of sourceList) {
      if (groups[c.status]) {
        groups[c.status].push(c)
      } else {
        groups.new.push(c)
      }
    }
    return groups
  })

  const fetchWithFilters = async (showLoading = true) => {
    if (showLoading) isLoading.value = true
    error.value = null
    try {
      if (viewMode.value === 'kanban') {
        // Fetch up to 100 candidates for Kanban board without small page cutoff
        const res = await service.fetchFiltered({
          ...filters,
          page: 1,
          pageSize: 100,
        })
        allCandidatesForKanban.value = res.items
        totalCount.value = res.totalCount
      } else {
        const res = await service.fetchFiltered({
          ...filters,
          page: page.value,
          pageSize: pageSize.value,
        })
        candidates.value = res.items
        totalCount.value = res.totalCount
        totalPages.value = res.totalPages
      }
      isLoaded.value = true
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
    } finally {
      if (showLoading) isLoading.value = false
    }
  }

  const fetchAll = async (force = false) => {
    if (!force && isLoaded.value && (candidates.value.length > 0 || allCandidatesForKanban.value.length > 0)) {
      void fetchWithFilters(false)
      return
    }
    page.value = 1
    await fetchWithFilters(true)
  }

  const setViewMode = async (mode: CandidateViewMode) => {
    viewMode.value = mode
    await fetchWithFilters()
  }

  const setPage = async (newPage: number) => {
    page.value = Math.max(1, Math.min(newPage, totalPages.value))
    await fetchWithFilters()
  }

  const setPageSize = async (newSize: number) => {
    pageSize.value = newSize
    page.value = 1
    await fetchWithFilters()
  }

  const setFilter = async <K extends keyof CandidateFilterParams>(key: K, value: CandidateFilterParams[K]) => {
    filters[key] = value
    page.value = 1
    await fetchWithFilters()
  }

  const resetFilters = async () => {
    filters.searchQuery = ''
    filters.vacancyId = null
    filters.status = 'all'
    filters.source = 'all'
    filters.datePeriod = 'all'
    filters.sortBy = 'created_at_desc'
    page.value = 1
    await fetchWithFilters()
  }

  const fetchById = async (id: string) => {
    isLoading.value = true
    error.value = null
    try {
      currentCandidate.value = await service.fetchById(id)
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
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
      allCandidatesForKanban.value.unshift(candidate)
      totalCount.value += 1
      return candidate
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
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
      const listIdx = candidates.value.findIndex(c => c.id === id)
      if (listIdx !== -1) candidates.value[listIdx] = updated

      const kanbanIdx = allCandidatesForKanban.value.findIndex(c => c.id === id)
      if (kanbanIdx !== -1) allCandidatesForKanban.value[kanbanIdx] = updated

      if (currentCandidate.value?.id === id) currentCandidate.value = updated
      return true
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const updateStatus = async (id: string, status: CandidateStatus): Promise<boolean> => {
    return update(id, { status })
  }

  const search = async (query: string) => {
    filters.searchQuery = query
    page.value = 1
    await fetchWithFilters()
  }

  const deleteCandidate = async (id: string): Promise<boolean> => {
    try {
      await service.delete(id)
      candidates.value = candidates.value.filter(c => c.id !== id)
      allCandidatesForKanban.value = allCandidatesForKanban.value.filter(c => c.id !== id)
      totalCount.value = Math.max(0, totalCount.value - 1)
      return true
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
      return false
    }
  }

  return {
    candidates,
    allCandidatesForKanban,
    currentCandidate,
    isLoading,
    isLoaded,
    error,
    viewMode,
    page,
    pageSize,
    totalCount,
    totalPages,
    filters,
    kanbanColumns,
    fetchAll,
    fetchWithFilters,
    setViewMode,
    setPage,
    setPageSize,
    setFilter,
    resetFilters,
    fetchById,
    create,
    update,
    updateStatus,
    search,
    deleteCandidate,
  }
})
