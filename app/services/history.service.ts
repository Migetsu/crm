import type { SupabaseClient } from '@supabase/supabase-js'
import type { HistoryEvent } from '~/types/history.types'

export class HistoryService {
  constructor(private supabase: SupabaseClient) {}

  async fetchByCandidateId(candidateId: string): Promise<HistoryEvent[]> {
    const { data, error } = await this.supabase
      .from('candidate_history')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async create(event: Omit<HistoryEvent, 'id' | 'created_at'>): Promise<HistoryEvent> {
    const { data, error } = await this.supabase
      .from('candidate_history')
      .insert(event)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
