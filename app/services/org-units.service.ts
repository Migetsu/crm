import type { AppSupabaseClient } from './candidates.service'
import type { OrgUnit, OrgUnitManager } from '~/types/org-unit.types'

export class OrgUnitsService {
  constructor(private supabase: AppSupabaseClient) {}

  async fetchAll(): Promise<OrgUnit[]> {
    const { data, error } = await this.supabase
      .from('org_units')
      .select('*, managers:org_unit_managers(*)')
      .order('name')

    if (error) throw error
    return (data || []) as OrgUnit[]
  }

  async fetchById(id: string): Promise<OrgUnit> {
    const { data, error } = await this.supabase
      .from('org_units')
      .select('*, managers:org_unit_managers(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as OrgUnit
  }

  async create(payload: Omit<OrgUnit, 'id' | 'created_at'>): Promise<OrgUnit> {
    const { data, error } = await this.supabase
      .from('org_units')
      .insert(payload)
      .select('*, managers:org_unit_managers(*)')
      .single()

    if (error) throw error
    return data as OrgUnit
  }

  async update(id: string, payload: Partial<OrgUnit>): Promise<OrgUnit> {
    const { data, error } = await this.supabase
      .from('org_units')
      .update(payload)
      .eq('id', id)
      .select('*, managers:org_unit_managers(*)')
      .single()

    if (error) throw error
    return data as OrgUnit
  }

  async search(query: string): Promise<OrgUnit[]> {
    if (!query.trim()) return this.fetchAll()

    const { data, error } = await this.supabase
      .from('org_units')
      .select('*, managers:org_unit_managers(*)')
      .or(`name.ilike.%${query}%,interview_address.ilike.%${query}%`)
      .order('name')

    if (error) throw error
    return (data || []) as OrgUnit[]
  }

  async fetchManagers(orgUnitId: string): Promise<OrgUnitManager[]> {
    const { data, error } = await this.supabase
      .from('org_unit_managers')
      .select('*')
      .eq('org_unit_id', orgUnitId)

    if (error) throw error
    return data || []
  }

  async addManager(manager: Omit<OrgUnitManager, 'id'>): Promise<OrgUnitManager> {
    const { data, error } = await this.supabase
      .from('org_unit_managers')
      .insert(manager)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async removeManager(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('org_unit_managers')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
