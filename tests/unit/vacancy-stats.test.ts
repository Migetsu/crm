import { describe, it, expect } from 'vitest'
import { calculateVacancyStats } from '../../app/utils/vacancy-stats'
import type { Candidate } from '../../app/types/candidate.types'

describe('calculateVacancyStats', () => {
  it('correctly aggregates counts by status groups', () => {
    const candidates = [
      { id: '1', vacancy_id: 'v1', status: 'new' },
      { id: '2', vacancy_id: 'v1', status: 'new' },
      { id: '3', vacancy_id: 'v1', status: 'interview_scheduled' },
      { id: '4', vacancy_id: 'v1', status: 'interview_done' },
      { id: '5', vacancy_id: 'v1', status: 'offer_accepted' },
      { id: '6', vacancy_id: 'v1', status: 'rejected' },
      { id: '7', vacancy_id: 'v1', status: 'self_rejected' },
      { id: '8', vacancy_id: 'v1', status: 'reserve' },
    ] as Candidate[]

    const stats = calculateVacancyStats(candidates)

    expect(stats.total).toBe(8)
    expect(stats.new).toBe(2)
    expect(stats.interview).toBe(2)
    expect(stats.accepted).toBe(1)
    expect(stats.rejected).toBe(2)
    expect(stats.reserve).toBe(1)
  })

  it('handles empty candidates list gracefully', () => {
    const stats = calculateVacancyStats([])

    expect(stats.total).toBe(0)
    expect(stats.new).toBe(0)
    expect(stats.interview).toBe(0)
    expect(stats.accepted).toBe(0)
    expect(stats.rejected).toBe(0)
    expect(stats.reserve).toBe(0)
  })
})
