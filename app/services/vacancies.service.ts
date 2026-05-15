import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vacancy } from '~/types/vacancy.types'

export class VacanciesService {
  constructor(private supabase: SupabaseClient) {}

  async fetchAll(): Promise<Vacancy[]> {
    const { data, error } = await this.supabase
      .from('vacancies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async fetchById(id: string): Promise<Vacancy> {
    const { data, error } = await this.supabase
      .from('vacancies')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async fetchOpen(): Promise<Vacancy[]> {
    const { data, error } = await this.supabase
      .from('vacancies')
      .select('*')
      .eq('is_open', true)
      .order('title')

    if (error) throw error
    return data || []
  }

  async create(payload: Omit<Vacancy, 'id' | 'created_at'>): Promise<Vacancy> {
    const { data, error } = await this.supabase
      .from('vacancies')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, payload: Partial<Vacancy>): Promise<Vacancy> {
    const { data, error } = await this.supabase
      .from('vacancies')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async toggleOpen(id: string, isOpen: boolean): Promise<Vacancy> {
    return this.update(id, { is_open: isOpen })
  }

  async search(query: string): Promise<Vacancy[]> {
    if (!query.trim()) return this.fetchAll()

    const { data, error } = await this.supabase
      .from('vacancies')
      .select('*')
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}
