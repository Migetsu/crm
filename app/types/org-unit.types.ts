export interface OrgUnit {
  id: string
  name: string
  category: string | null
  interview_address: string
  director_full_name: string
  director_email: string
  director_phone: string
  cluster_director_full_name: string
  cluster_director_email: string
  hr_full_name: string | null
  hr_email: string | null
  hr_phone: string | null
  regional_office: string | null
  territory: string | null
  macroregion: string | null
  division: string | null
  cluster: string | null
  sap_id: string | null
  cfo: string | null
  opened_at: string | null
  timezone: string
  actual_location: string | null
  created_at: string
  managers?: OrgUnitManager[]
}

export type ManagerRole = 'director' | 'hr' | 'manager'

export const MANAGER_ROLE_LABELS: Record<ManagerRole, string> = {
  director: 'Директор филиала',
  hr: 'HR-менеджер',
  manager: 'Управляющий',
}

export interface OrgUnitManager {
  id: string
  org_unit_id: string
  full_name: string
  email: string
  phone: string
  role?: ManagerRole | string
}
