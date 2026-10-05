import type { AppSupabaseClient } from './candidates.service'
import type { HistoryEvent, HistoryAuthor } from '~/types/history.types'

interface RawHistoryRow {
  id: string
  candidate_id: string
  type: string
  title: string
  body: string | null
  created_at: string
  created_by: string | null
  meta: Record<string, unknown> | null
  author?: HistoryAuthor | null
}

export class HistoryService {
  constructor(private supabase: AppSupabaseClient) {}

  async fetchByCandidateId(candidateId: string): Promise<HistoryEvent[]> {
    const { data, error } = await this.supabase
      .from('candidate_history')
      .select('*, author:profiles(id, full_name, email, role)')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return ((data || []) as unknown as RawHistoryRow[]).map(row => ({
      id: row.id,
      candidate_id: row.candidate_id,
      type: row.type as HistoryEvent['type'],
      title: row.title,
      body: row.body,
      created_at: row.created_at,
      created_by: row.created_by,
      meta: (row.meta || null) as HistoryEvent['meta'],
      author: row.author || null,
    }))
  }

  async create(event: Omit<HistoryEvent, 'id' | 'created_at' | 'author'>): Promise<HistoryEvent> {
    const { data, error } = await this.supabase
      .from('candidate_history')
      .insert({
        candidate_id: event.candidate_id,
        type: event.type,
        title: event.title,
        body: event.body,
        created_by: event.created_by,
        meta: event.meta,
      })
      .select('*, author:profiles(id, full_name, email, role)')
      .single()

    if (error) throw error
    const row = data as unknown as RawHistoryRow
    return {
      id: row.id,
      candidate_id: row.candidate_id,
      type: row.type as HistoryEvent['type'],
      title: row.title,
      body: row.body,
      created_at: row.created_at,
      created_by: row.created_by,
      meta: (row.meta || null) as HistoryEvent['meta'],
      author: row.author || null,
    }
  }
}
