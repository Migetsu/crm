import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '~/utils/error'

describe('getErrorMessage utility', () => {
  it('should extract message from standard Error', () => {
    expect(getErrorMessage(new Error('Test error'))).toBe('Test error')
  })

  it('should extract message from object with message property', () => {
    expect(getErrorMessage({ message: 'Custom object error' })).toBe('Custom object error')
  })

  it('should handle raw string errors', () => {
    expect(getErrorMessage('Raw string error')).toBe('Raw string error')
  })

  it('should extract statusMessage from FetchError-like objects', () => {
    const fetchErr = {
      message: '[POST] "/api/admin/update-user": 500',
      data: {
        statusCode: 500,
        statusMessage: 'Ошибка обновления профиля: Ограничение доступа',
      },
    }
    expect(getErrorMessage(fetchErr)).toBe('Ошибка обновления профиля: Ограничение доступа')
  })

  it('should return default fallback for unexpected types', () => {
    expect(getErrorMessage(null)).toBe('Unknown error occurred')
    expect(getErrorMessage(12345)).toBe('Unknown error occurred')
  })
})
