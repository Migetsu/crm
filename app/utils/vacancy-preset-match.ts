import { VACANCY_PRESETS, type VacancyPreset } from '~/data/vacancy-presets'
import type { Vacancy } from '~/types/vacancy.types'

const normalize = (title: string): string => title.trim().toLowerCase().replace(/[-–—]/g, ' ')

// Order matters: "заместител" must be checked before "директор"
const KEYWORD_TO_PRESET_ID: ReadonlyArray<readonly [string, string]> = [
  ['заместител', 'deputy-director'],
  ['директор', 'store-director'],
  ['администратор', 'store-admin'],
  ['кассир', 'cashier'],
  ['пекар', 'baker'],
  ['сборщик', 'picker'],
]

export const resolvePresetId = (title: string): string | null => {
  const norm = normalize(title)
  const exact = VACANCY_PRESETS.find(p => normalize(p.title) === norm)
  if (exact) return exact.id
  const byKeyword = KEYWORD_TO_PRESET_ID.find(([keyword]) => norm.includes(keyword))
  return byKeyword ? byKeyword[1] : null
}

export const isSamePosition = (titleA: string, titleB: string): boolean => {
  if (normalize(titleA) === normalize(titleB)) return true
  const idA = resolvePresetId(titleA)
  return idA !== null && idA === resolvePresetId(titleB)
}

export const findVacancyForPreset = (
  preset: VacancyPreset,
  vacancies: Vacancy[],
): Vacancy | undefined => vacancies.find(v => resolvePresetId(v.title) === preset.id)
