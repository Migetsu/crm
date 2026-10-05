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

  it('should return default fallback for unexpected types', () => {
    expect(getErrorMessage(null)).toBe('Unknown error occurred')
    expect(getErrorMessage(12345)).toBe('Unknown error occurred')
  })
})
