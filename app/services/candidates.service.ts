import type { SupabaseClient } from '@supabase/supabase-js'
import type { Candidate, CandidateCreatePayload, CandidateStatus } from '~/types/candidate.types'

export class CandidatesService {
  constructor(private supabase: SupabaseClient) {}

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
