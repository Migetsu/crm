import { describe, it, expect } from 'vitest'
import {
  calculateFunnel,
  calculateSourceMetrics,
  calculateTimeToHire,
  filterCandidatesForAnalytics,
  buildCsvString,
  generateCandidatesCsv,
  generateFunnelReportCsv,
} from '~/utils/analytics'
import type { Candidate } from '~/types/candidate.types'
import type { Vacancy } from '~/types/vacancy.types'
import type { OrgUnit } from '~/types/org-unit.types'
import type { HistoryEvent } from '~/types/history.types'
import type { AnalyticsFilter } from '~/types/analytics.types'

const mockCandidates: Candidate[] = [
  {
    id: 'c1',
    first_name: 'Иван',
    last_name: 'Иванов',
    middle_name: 'Иванович',
    has_no_middle_name: false,
    birth_date: '1995-01-01',
    recommended_by: null,
    gender: 'male',
    phone: '+79991112233',
    email: 'ivan@test.ru',
    resume_link: null,
    address: 'Москва',
    citizenship: 'ru',
    source: 'hh',
    add_method: 'manual',
    status: 'offer_accepted',
    tags: [],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    vacancy_id: 'v1',
    created_by: null,
  },
  {
    id: 'c2',
    first_name: 'Анна',
    last_name: 'Петрова',
    middle_name: null,
    has_no_middle_name: true,
    birth_date: '1998-05-12',
    recommended_by: null,
    gender: 'female',
    phone: '+79994445566',
    email: 'anna@test.ru',
    resume_link: null,
    address: 'Москва',
    citizenship: 'ru',
    source: 'avito',
    add_method: 'response',
    status: 'interview_scheduled',
    tags: [],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    vacancy_id: 'v1',
    created_by: null,
  },
  {
    id: 'c3',
    first_name: 'Сергей',
    last_name: 'Сидоров',
    middle_name: null,
    has_no_middle_name: false,
    birth_date: '1992-03-20',
    recommended_by: null,
    gender: 'male',
    phone: '+79997778899',
    email: null,
    resume_link: null,
    address: 'Казань',
    citizenship: 'ru',
    source: 'hh',
    add_method: 'manual',
    status: 'new',
    tags: [],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    vacancy_id: 'v2',
    created_by: null,
  },
  {
    id: 'c4',
    first_name: 'Елена',
    last_name: 'Козлова',
    middle_name: null,
    has_no_middle_name: false,
    birth_date: '1990-11-15',
    recommended_by: null,
    gender: 'female',
    phone: '+79990001122',
    email: 'elena@test.ru',
    resume_link: null,
    address: 'Москва',
    citizenship: 'ru',
    source: 'hh',
    add_method: 'response',
    status: 'rejected',
    tags: [],
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    vacancy_id: 'v1',
    created_by: null,
  },
]

const mockVacancies: Vacancy[] = [
  {
    id: 'v1',
    title: 'Кассир',
    description: null,
    requirements: null,
    responsibilities: null,
    org_unit_id: 'org1',
    is_open: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'v2',
    title: 'Кладовщик',
    description: null,
    requirements: null,
    responsibilities: null,
    org_unit_id: 'org2',
    is_open: true,
    created_at: '2026-01-01T00:00:00Z',
  },
]

describe('Analytics Utils', () => {
  it('calculates recruitment funnel correctly', () => {
    const funnel = calculateFunnel(mockCandidates)

    expect(funnel).toHaveLength(5)
    // Stage 1: New (total)
    expect(funnel[0].count).toBe(4)
    expect(funnel[0].conversionTotal).toBe(100)

    // Stage 2: Screening (non-new candidates: c1, c2, c4)
    expect(funnel[1].count).toBe(3)
    expect(funnel[1].conversionTotal).toBe(75) // 3/4 = 75%
    expect(funnel[1].conversionStep).toBe(75)

    // Stage 3: Interview (c1 accepted, c2 scheduled)
    expect(funnel[2].count).toBe(2)
    expect(funnel[2].conversionTotal).toBe(50) // 2/4 = 50%

    // Stage 5: Hired (c1)
    expect(funnel[4].count).toBe(1)
    expect(funnel[4].conversionTotal).toBe(25) // 1/4 = 25%
  })

  it('calculates source metrics correctly', () => {
    const sources = calculateSourceMetrics(mockCandidates)

    // hh has 3 candidates (c1, c3, c4), avito has 1 (c2)
    const hh = sources.find(s => s.source === 'hh')
    expect(hh).toBeDefined()
    expect(hh?.total).toBe(3)
    expect(hh?.hired).toBe(1)
    expect(hh?.conversionToHire).toBe(33) // 1/3 = 33%

    const avito = sources.find(s => s.source === 'avito')
    expect(avito).toBeDefined()
    expect(avito?.total).toBe(1)
    expect(avito?.interviews).toBe(1)
    expect(avito?.hired).toBe(0)
  })

  it('calculates time to hire metrics', () => {
    const history: HistoryEvent[] = [
      {
        id: 'h1',
        candidate_id: 'c1',
        type: 'status_change',
        title: 'Принят',
        body: null,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: null,
        meta: { to_status: 'offer_accepted' },
      },
    ]

    const metrics = calculateTimeToHire(mockCandidates, history)
    expect(metrics.hiredCount).toBe(1)
    // c1 created 10 days ago, hired 2 days ago -> ~8 days
    expect(metrics.avgDaysToHire).toBe(8)
  })

  it('filters candidates by vacancy and period', () => {
    const filter1: AnalyticsFilter = {
      period: 'all',
      vacancyId: 'v1',
      orgUnitId: '',
      source: '',
    }
    const res1 = filterCandidatesForAnalytics(mockCandidates, mockVacancies, filter1)
    expect(res1.map(c => c.id)).toEqual(['c1', 'c2', 'c4'])

    // Filter by period 7 days (c4 was created 40 days ago, c1 was created 10 days ago)
    const filter2: AnalyticsFilter = {
      period: '7d',
      vacancyId: '',
      orgUnitId: '',
      source: '',
    }
    const res2 = filterCandidatesForAnalytics(mockCandidates, mockVacancies, filter2)
    expect(res2.map(c => c.id)).toEqual(['c2', 'c3'])
  })

  it('filters candidates by org unit', () => {
    const filter: AnalyticsFilter = {
      period: 'all',
      vacancyId: '',
      orgUnitId: 'org2', // v2 has org2
      source: '',
    }
    const res = filterCandidatesForAnalytics(mockCandidates, mockVacancies, filter)
    expect(res.map(c => c.id)).toEqual(['c3'])
  })

  it('generates CSV string with UTF-8 BOM and semicolon delimiters', () => {
    const rows = [
      ['Иванов', 'Иван', 'Телефон: +7; тест'],
      ['Петров', 'Петр', 'Без разделителя'],
    ]
    const headers = ['Фамилия', 'Имя', 'Заметка']

    const csv = buildCsvString(rows, headers)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('Фамилия;Имя;Заметка')
    // Check escaping for cells containing semicolons
    expect(csv).toContain('"Телефон: +7; тест"')
  })

  it('generates candidate database CSV export correctly', () => {
    const orgUnits: OrgUnit[] = [{ id: 'org1', name: 'Офис Москва' } as OrgUnit]
    const csv = generateCandidatesCsv(mockCandidates, mockVacancies, orgUnits)

    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('Иванов;Иван;Иванович')
    expect(csv).toContain('Кассир')
    expect(csv).toContain('Офис Москва')
  })

  it('generates funnel report CSV correctly', () => {
    const funnel = calculateFunnel(mockCandidates)
    const sources = calculateSourceMetrics(mockCandidates)
    const timeToHire = calculateTimeToHire(mockCandidates)

    const summary = {
      totalCandidates: 4,
      hiredCount: 1,
      overallConversion: 25,
      funnel,
      sources,
      timeToHire,
      rejections: [],
    }

    const csv = generateFunnelReportCsv(summary, 'Всё время')
    expect(csv).toContain('Отчёт по воронке подбора и эффективности найма')
    expect(csv).toContain('ЭТАПЫ ВОРОНКИ ПОДБОРА')
    expect(csv).toContain('ИСТОЧНИКИ КАНДИДАТОВ')
  })
})
