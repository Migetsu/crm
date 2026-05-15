import type { SupabaseClient } from '@supabase/supabase-js'
import type { Template, TemplateType } from '~/types/template.types'

export class TemplatesService {
  constructor(private supabase: SupabaseClient) {}

  async fetchByType(type: TemplateType): Promise<Template[]> {
    const { data, error } = await this.supabase
      .from('templates')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async update(id: string, payload: Partial<Template>): Promise<Template> {
    const { data, error } = await this.supabase
      .from('templates')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async create(payload: Omit<Template, 'id' | 'created_at'>): Promise<Template> {
    const { data, error } = await this.supabase
      .from('templates')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('templates')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
