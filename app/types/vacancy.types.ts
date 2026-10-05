export interface CandidateStatusCounts {
  total: number
  new: number
  interview: number
  accepted: number
  rejected: number
  reserve: number
}

export interface Vacancy {
  id: string
  title: string
  description: string | null
  requirements: string | null
  responsibilities: string | null
  org_unit_id: string | null
  is_open: boolean
  created_at: string
  org_unit_name?: string
  org_unit_address?: string
  status_counts?: CandidateStatusCounts
}

export interface VacancyWithCounts extends Vacancy {
  candidates_count: number
}
