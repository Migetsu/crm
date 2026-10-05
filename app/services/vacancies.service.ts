import type { AppSupabaseClient } from './candidates.service'
import type { Vacancy } from '~/types/vacancy.types'
import { calculateVacancyStats } from '~/utils/vacancy-stats'

interface RawVacancyRow {
  id: string
  title: string
  description: string | null
  requirements: string | null
  responsibilities: string | null
  org_unit_id: string | null
  is_open: boolean
  created_at: string
  org_unit?: {
    id: string
    name: string
    interview_address: string
  } | null
}

interface RawCandidateMiniRow {
  id: string
  vacancy_id: string | null
  status: string
}

export class VacanciesService {
  constructor(private supabase: AppSupabaseClient) {}

  async fetchAll(): Promise<Vacancy[]> {
    const [vacanciesRes, candidatesRes] = await Promise.all([
      this.supabase
        .from('vacancies')
        .select('*, org_unit:org_units(id, name, interview_address)')
        .order('created_at', { ascending: false }),
      this.supabase
        .from('candidates')
        .select('id, vacancy_id, status'),
    ])

    if (vacanciesRes.error) throw vacanciesRes.error

    const candidates = (candidatesRes.data || []) as RawCandidateMiniRow[]
    const rawVacancies = (vacanciesRes.data || []) as unknown as RawVacancyRow[]

    return rawVacancies.map(row => {
      const vacancyCandidates = candidates.filter(c => c.vacancy_id === row.id)
      const stats = calculateVacancyStats(vacancyCandidates)

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        requirements: row.requirements,
        responsibilities: row.responsibilities,
        org_unit_id: row.org_unit_id,
        is_open: row.is_open,
        created_at: row.created_at,
        org_unit_name: row.org_unit?.name || undefined,
        org_unit_address: row.org_unit?.interview_address || undefined,
        status_counts: stats,
      }
    })
  }

  async fetchById(id: string): Promise<Vacancy> {
    const [vacancyRes, candidatesRes] = await Promise.all([
      this.supabase
        .from('vacancies')
        .select('*, org_unit:org_units(id, name, interview_address)')
        .eq('id', id)
        .single(),
      this.supabase
        .from('candidates')
        .select('id, vacancy_id, status')
        .eq('vacancy_id', id),
    ])

    if (vacancyRes.error) throw vacancyRes.error

    const row = vacancyRes.data as unknown as RawVacancyRow
    const candidates = (candidatesRes.data || []) as RawCandidateMiniRow[]
    const stats = calculateVacancyStats(candidates)

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      requirements: row.requirements,
      responsibilities: row.responsibilities,
      org_unit_id: row.org_unit_id,
      is_open: row.is_open,
      created_at: row.created_at,
      org_unit_name: row.org_unit?.name || undefined,
      org_unit_address: row.org_unit?.interview_address || undefined,
      status_counts: stats,
    }
  }

  async fetchOpen(): Promise<Vacancy[]> {
    const { data, error } = await this.supabase
      .from('vacancies')
      .select('*, org_unit:org_units(id, name, interview_address)')
      .eq('is_open', true)
      .order('title')

    if (error) throw error
    const rows = (data || []) as unknown as RawVacancyRow[]
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      requirements: r.requirements,
      responsibilities: r.responsibilities,
      org_unit_id: r.org_unit_id,
      is_open: r.is_open,
      created_at: r.created_at,
      org_unit_name: r.org_unit?.name || undefined,
      org_unit_address: r.org_unit?.interview_address || undefined,
    }))
  }

  async create(payload: Omit<Vacancy, 'id' | 'created_at' | 'status_counts'>): Promise<Vacancy> {
    const { data, error } = await this.supabase
      .from('vacancies')
      .insert(payload)
      .select('*, org_unit:org_units(id, name, interview_address)')
      .single()

    if (error) throw error
    const row = data as unknown as RawVacancyRow
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      requirements: row.requirements,
      responsibilities: row.responsibilities,
      org_unit_id: row.org_unit_id,
      is_open: row.is_open,
      created_at: row.created_at,
      org_unit_name: row.org_unit?.name || undefined,
      org_unit_address: row.org_unit?.interview_address || undefined,
      status_counts: { total: 0, new: 0, interview: 0, accepted: 0, rejected: 0, reserve: 0 },
    }
  }

  async update(id: string, payload: Partial<Vacancy>): Promise<Vacancy> {
    const { data, error } = await this.supabase
      .from('vacancies')
      .update(payload)
      .eq('id', id)
      .select('*, org_unit:org_units(id, name, interview_address)')
      .single()

    if (error) throw error
    const row = data as unknown as RawVacancyRow
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      requirements: row.requirements,
      responsibilities: row.responsibilities,
      org_unit_id: row.org_unit_id,
      is_open: row.is_open,
      created_at: row.created_at,
      org_unit_name: row.org_unit?.name || undefined,
      org_unit_address: row.org_unit?.interview_address || undefined,
    }
  }

  async toggleOpen(id: string, isOpen: boolean): Promise<Vacancy> {
    return this.update(id, { is_open: isOpen })
  }

  async search(query: string): Promise<Vacancy[]> {
    if (!query.trim()) return this.fetchAll()

    const { data, error } = await this.supabase
      .from('vacancies')
      .select('*, org_unit:org_units(id, name, interview_address)')
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    const rows = (data || []) as unknown as RawVacancyRow[]
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      requirements: r.requirements,
      responsibilities: r.responsibilities,
      org_unit_id: r.org_unit_id,
      is_open: r.is_open,
      created_at: r.created_at,
      org_unit_name: r.org_unit?.name || undefined,
      org_unit_address: r.org_unit?.interview_address || undefined,
    }))
  }
}
