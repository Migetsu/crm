import type { useSupabaseClient } from '#imports'
import type {
  Candidate,
  CandidateCreatePayload,
  CandidateStatus,
  CandidateFilterParams,
  CandidateListResponse,
} from '~/types/candidate.types'

export type AppSupabaseClient = ReturnType<typeof useSupabaseClient>

export class CandidatesService {
  constructor(private supabase: AppSupabaseClient) {}

  async fetchFiltered(params: CandidateFilterParams = {}): Promise<CandidateListResponse> {
    const page = Math.max(1, params.page || 1)
    const pageSize = Math.max(1, params.pageSize || 10)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = this.supabase
      .from('candidates')
      .select('*', { count: 'exact' })

    if (params.searchQuery) {
      const normalized = params.searchQuery.replace(/[^\w\sа-яА-ЯёЁ+]/g, '').trim()
      if (normalized) {
        query = query.or(
          `last_name.ilike.%${normalized}%,first_name.ilike.%${normalized}%,middle_name.ilike.%${normalized}%,phone.ilike.%${normalized}%`
        )
      }
    }

    if (params.vacancyId) {
      query = query.eq('vacancy_id', params.vacancyId)
    }

    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status)
    }

    if (params.source && params.source !== 'all') {
      query = query.eq('source', params.source)
    }

    if (params.datePeriod && params.datePeriod !== 'all') {
      const now = new Date()
      let startDate: string | null = null
      if (params.datePeriod === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      } else if (params.datePeriod === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      } else if (params.datePeriod === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
      if (startDate) {
        query = query.gte('created_at', startDate)
      }
    }

    const sortBy = params.sortBy || 'created_at_desc'
    switch (sortBy) {
      case 'created_at_asc':
        query = query.order('created_at', { ascending: true })
        break
      case 'name_asc':
        query = query.order('last_name', { ascending: true })
        break
      case 'name_desc':
        query = query.order('last_name', { ascending: false })
        break
      case 'status_asc':
        query = query.order('status', { ascending: true })
        break
      case 'created_at_desc':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    const { data, count, error } = await query.range(from, to)
    if (error) throw error

    const totalCount = count || 0
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

    return {
      items: data || [],
      totalCount,
      page,
      pageSize,
      totalPages,
    }
  }

  async fetchAll(): Promise<Candidate[]> {
    const { data, error } = await this.supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async fetchById(id: string): Promise<Candidate> {
    const { data, error } = await this.supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async create(payload: CandidateCreatePayload): Promise<Candidate> {
    const { data, error } = await this.supabase
      .from('candidates')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, payload: Partial<Candidate>): Promise<Candidate> {
    const { data, error } = await this.supabase
      .from('candidates')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateStatus(id: string, status: CandidateStatus): Promise<Candidate> {
    return this.update(id, { status })
  }

  async search(query: string): Promise<Candidate[]> {
    const normalizedQuery = query.replace(/[^\w\sа-яА-ЯёЁ+]/g, '').trim()
    if (!normalizedQuery) return this.fetchAll()

    const { data, error } = await this.supabase
      .from('candidates')
      .select('*')
      .or(
        `last_name.ilike.%${normalizedQuery}%,first_name.ilike.%${normalizedQuery}%,middle_name.ilike.%${normalizedQuery}%,phone.ilike.%${normalizedQuery}%`
      )
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('candidates')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
