export interface Vacancy {
  id: string
  title: string
  description: string | null
  requirements: string | null
  responsibilities: string | null
  org_unit_id: string | null
  is_open: boolean
  created_at: string
}

export interface VacancyWithCounts extends Vacancy {
  candidates_count: number
  org_unit_name?: string
}
