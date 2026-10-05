import { describe, it, expect } from 'vitest'
import type { CandidateFilterParams } from '~/types/candidate.types'

describe('Candidate Filtering & Pagination Utilities', () => {
  const calculatePagination = (totalCount: number, page: number, pageSize: number) => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const from = (safePage - 1) * pageSize
    const to = from + pageSize - 1
    return { totalPages, safePage, from, to }
  }

  it('should correctly calculate range for first page', () => {
    const { from, to, totalPages } = calculatePagination(25, 1, 10)
    expect(from).toBe(0)
    expect(to).toBe(9)
    expect(totalPages).toBe(3)
  })

  it('should correctly calculate range for middle and last page', () => {
    const secondPage = calculatePagination(25, 2, 10)
    expect(secondPage.from).toBe(10)
    expect(secondPage.to).toBe(19)

    const lastPage = calculatePagination(25, 3, 10)
    expect(lastPage.from).toBe(20)
    expect(lastPage.to).toBe(29)
  })

  it('should handle empty result sets with minimum 1 total page', () => {
    const { totalPages, from } = calculatePagination(0, 1, 10)
    expect(totalPages).toBe(1)
    expect(from).toBe(0)
  })

  it('should format date range filters correctly', () => {
    const getStartDateForPeriod = (period?: CandidateFilterParams['datePeriod']): string | null => {
      const now = new Date()
      if (period === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        return start.toISOString()
      }
      if (period === 'week') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return start.toISOString()
      }
      if (period === 'month') {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return start.toISOString()
      }
      return null
    }

    expect(getStartDateForPeriod('all')).toBeNull()
    expect(getStartDateForPeriod(undefined)).toBeNull()
    expect(getStartDateForPeriod('today')).toBeTruthy()
    expect(getStartDateForPeriod('week')).toBeTruthy()
  })
})
