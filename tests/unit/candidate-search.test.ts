import { describe, it, expect } from 'vitest'

describe('Candidate Search Logic', () => {
  const normalizeQuery = (query: string): string => {
    return query.replace(/[^\w\sа-яА-ЯёЁ+]/g, '').trim()
  }

  it('should clean special characters and punctuation', () => {
    expect(normalizeQuery('Иванов, Иван!?')).toBe('Иванов Иван')
  })

  it('should preserve plus sign for phone numbers', () => {
    expect(normalizeQuery('+7 (999) 123-45-67')).toBe('+7 999 1234567')
  })

  it('should return empty string for purely special character queries', () => {
    expect(normalizeQuery('!@#$%^&*()')).toBe('')
  })
})
