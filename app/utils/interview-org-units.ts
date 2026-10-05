import type { OrgUnit } from '~/types/org-unit.types'
import type { Vacancy } from '~/types/vacancy.types'

/**
 * Normalizes title for comparison (lowercase, trimmed, dashes replaced with spaces)
 */
export const normalizeVacancyTitle = (title: string): string => {
  return title.trim().toLowerCase().replace(/[-–—]/g, ' ')
}

/**
 * Checks whether two vacancy titles refer to the same retail role or title
 */
export const isVacancyTitleMatching = (titleA: string, titleB: string): boolean => {
  const a = normalizeVacancyTitle(titleA)
  const b = normalizeVacancyTitle(titleB)

  if (a === b) return true

  // Standard retail role keywords
  const keywords = [
    'кассир',
    'пекар',
    'сборщик',
    'комплектовщик',
    'администратор',
    'заместител',
    'директор',
    'грузчик',
    'товаровед',
  ]

  for (const kw of keywords) {
    if (a.includes(kw) && b.includes(kw)) {
      return true
    }
  }

  return false
}

export interface GetRelevantOrgUnitsParams {
  candidateVacancyTitle?: string | null
  candidateVacancy?: Vacancy | null
  vacancies: Vacancy[]
  orgUnits: OrgUnit[]
}

/**
 * Filters org units to only those where the candidate's vacancy role is currently open.
 * Falls back to all org units if no vacancy is specified or no units have open positions.
 */
export const getRelevantOrgUnits = ({
  candidateVacancyTitle,
  candidateVacancy,
  vacancies,
  orgUnits,
}: GetRelevantOrgUnitsParams): OrgUnit[] => {
  const targetTitle = candidateVacancyTitle || candidateVacancy?.title

  if (!targetTitle && !candidateVacancy) {
    return orgUnits
  }

  // Find all open vacancies in the system that match candidate's role
  const matchingOpenOrgUnitIds = new Set<string>()

  for (const v of vacancies) {
    if (!v.is_open || !v.org_unit_id) continue

    // Exact vacancy match
    if (candidateVacancy && v.id === candidateVacancy.id) {
      matchingOpenOrgUnitIds.add(v.org_unit_id)
      continue
    }

    // Role or title match
    if (targetTitle && isVacancyTitleMatching(targetTitle, v.title)) {
      matchingOpenOrgUnitIds.add(v.org_unit_id)
    }
  }

  // If candidate's direct vacancy has an assigned org_unit and is open
  if (candidateVacancy?.org_unit_id && candidateVacancy.is_open) {
    matchingOpenOrgUnitIds.add(candidateVacancy.org_unit_id)
  }

  const filtered = orgUnits.filter(u => matchingOpenOrgUnitIds.has(u.id))

  // Return filtered list, or fallback to all units if none matched
  return filtered.length > 0 ? filtered : orgUnits
}

export interface DetermineInterviewSelectionParams {
  relevantUnits: OrgUnit[]
  currentSelection?: string | null
  candidateVacancy?: Vacancy | null
}

/**
 * Automatically chooses the best org unit and its interview address.
 * Prefers current valid selection, or candidate's vacancy org unit, or the first available unit.
 */
export const determineInterviewSelection = ({
  relevantUnits,
  currentSelection,
  candidateVacancy,
}: DetermineInterviewSelectionParams): { orgUnitId: string; interviewAddress: string } | null => {
  if (relevantUnits.length === 0) return null

  let targetUnit: OrgUnit | undefined

  // 1. If currently selected unit is still valid in relevantUnits
  if (currentSelection) {
    targetUnit = relevantUnits.find(u => u.id === currentSelection)
  }

  // 2. If candidate has vacancy linked to a relevant unit
  if (!targetUnit && candidateVacancy?.org_unit_id) {
    targetUnit = relevantUnits.find(u => u.id === candidateVacancy.org_unit_id)
  }

  // 3. Fallback to first relevant unit
  if (!targetUnit) {
    targetUnit = relevantUnits[0]
  }

  return {
    orgUnitId: targetUnit.id,
    interviewAddress: targetUnit.interview_address || '',
  }
}
