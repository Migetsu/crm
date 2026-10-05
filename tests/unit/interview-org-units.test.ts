import { describe, it, expect } from 'vitest'
import {
  isVacancyTitleMatching,
  normalizeVacancyTitle,
  getRelevantOrgUnits,
  determineInterviewSelection,
} from '~/utils/interview-org-units'
import type { OrgUnit } from '~/types/org-unit.types'
import type { Vacancy } from '~/types/vacancy.types'

describe('interview-org-units utility', () => {
  const mockOrgUnits: OrgUnit[] = [
    {
      id: 'store-1',
      name: 'Магазин «Центральный»',
      interview_address: 'г. Москва, ул. Тверская, д. 1',
      category: 'Гипермаркет',
      director_full_name: 'Иванов И.И.',
      director_email: 'ivanov@company.local',
      director_phone: '+79991112233',
      cluster_director_full_name: '',
      cluster_director_email: '',
      hr_full_name: null,
      hr_email: null,
      hr_phone: null,
      regional_office: null,
      territory: null,
      macroregion: null,
      division: null,
      cluster: null,
      sap_id: null,
      cfo: null,
      opened_at: null,
      timezone: 'Europe/Moscow',
      actual_location: null,
      created_at: '2026-01-01',
    },
    {
      id: 'store-2',
      name: 'Магазин «Северный»',
      interview_address: 'г. Москва, ул. Полярная, д. 25',
      category: 'Супермаркет',
      director_full_name: 'Петров П.П.',
      director_email: 'petrov@company.local',
      director_phone: '+79992223344',
      cluster_director_full_name: '',
      cluster_director_email: '',
      hr_full_name: null,
      hr_email: null,
      hr_phone: null,
      regional_office: null,
      territory: null,
      macroregion: null,
      division: null,
      cluster: null,
      sap_id: null,
      cfo: null,
      opened_at: null,
      timezone: 'Europe/Moscow',
      actual_location: null,
      created_at: '2026-01-01',
    },
    {
      id: 'store-3',
      name: 'Магазин «Южный»',
      interview_address: 'г. Москва, ул. Южная, д. 10',
      category: 'Супермаркет',
      director_full_name: 'Сидоров С.С.',
      director_email: 'sidorov@company.local',
      director_phone: '+79993334455',
      cluster_director_full_name: '',
      cluster_director_email: '',
      hr_full_name: null,
      hr_email: null,
      hr_phone: null,
      regional_office: null,
      territory: null,
      macroregion: null,
      division: null,
      cluster: null,
      sap_id: null,
      cfo: null,
      opened_at: null,
      timezone: 'Europe/Moscow',
      actual_location: null,
      created_at: '2026-01-01',
    },
  ]

  const mockVacancies: Vacancy[] = [
    {
      id: 'vac-1',
      title: 'Продавец-кассир',
      org_unit_id: 'store-1',
      is_open: true,
      description: null,
      requirements: null,
      responsibilities: null,
      created_at: '2026-01-01',
    },
    {
      id: 'vac-2',
      title: 'Продавец-кассир',
      org_unit_id: 'store-2',
      is_open: false, // Closed!
      description: null,
      requirements: null,
      responsibilities: null,
      created_at: '2026-01-01',
    },
    {
      id: 'vac-3',
      title: 'Пекарь',
      org_unit_id: 'store-2',
      is_open: true,
      description: null,
      requirements: null,
      responsibilities: null,
      created_at: '2026-01-01',
    },
    {
      id: 'vac-4',
      title: 'Сборщик заказов',
      org_unit_id: 'store-3',
      is_open: true,
      description: null,
      requirements: null,
      responsibilities: null,
      created_at: '2026-01-01',
    },
  ]

  it('normalizes vacancy title', () => {
    expect(normalizeVacancyTitle(' Продавец—кассир ')).toBe('продавец кассир')
  })

  it('matches matching retail titles and keywords', () => {
    expect(isVacancyTitleMatching('Продавец-кассир', 'Кассир торгового зала')).toBe(true)
    expect(isVacancyTitleMatching('Пекарь', 'Пекарь-универсал')).toBe(true)
    expect(isVacancyTitleMatching('Сборщик заказов', 'Комплектовщик')).toBe(false)
    expect(isVacancyTitleMatching('Администратор магазина', 'Старший администратор')).toBe(true)
    expect(isVacancyTitleMatching('Кассир', 'Пекарь')).toBe(false)
  })

  it('filters org units to only those with open vacancy for the candidate role', () => {
    const relevant = getRelevantOrgUnits({
      candidateVacancyTitle: 'Продавец-кассир',
      vacancies: mockVacancies,
      orgUnits: mockOrgUnits,
    })

    // Store 1 has open cashier vacancy; Store 2 has closed cashier vacancy
    expect(relevant).toHaveLength(1)
    expect(relevant[0].id).toBe('store-1')
  })

  it('filters org units correctly for Baker', () => {
    const relevant = getRelevantOrgUnits({
      candidateVacancyTitle: 'Пекарь',
      vacancies: mockVacancies,
      orgUnits: mockOrgUnits,
    })

    expect(relevant).toHaveLength(1)
    expect(relevant[0].id).toBe('store-2')
  })

  it('falls back to all org units if no open vacancies matched', () => {
    const relevant = getRelevantOrgUnits({
      candidateVacancyTitle: 'Директор гипермаркета',
      vacancies: mockVacancies,
      orgUnits: mockOrgUnits,
    })

    expect(relevant).toHaveLength(3)
  })

  it('falls back to all org units if no vacancy specified at all', () => {
    const relevant = getRelevantOrgUnits({
      vacancies: mockVacancies,
      orgUnits: mockOrgUnits,
    })

    expect(relevant).toHaveLength(3)
  })

  it('auto-determines interview selection with address from target unit', () => {
    const relevant = getRelevantOrgUnits({
      candidateVacancyTitle: 'Пекарь',
      vacancies: mockVacancies,
      orgUnits: mockOrgUnits,
    })

    const selection = determineInterviewSelection({
      relevantUnits: relevant,
    })

    expect(selection).toEqual({
      orgUnitId: 'store-2',
      interviewAddress: 'г. Москва, ул. Полярная, д. 25',
    })
  })

  it('retains current selection if it is inside relevant units', () => {
    const selection = determineInterviewSelection({
      relevantUnits: mockOrgUnits,
      currentSelection: 'store-3',
    })

    expect(selection?.orgUnitId).toBe('store-3')
    expect(selection?.interviewAddress).toBe('г. Москва, ул. Южная, д. 10')
  })
})
