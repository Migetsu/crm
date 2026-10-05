import { describe, it, expect } from 'vitest'
import { getManagerRoleLabel } from '~/utils/manager-roles'

describe('getManagerRoleLabel', () => {
  it('returns proper labels for known roles', () => {
    expect(getManagerRoleLabel('director')).toBe('Директор филиала')
    expect(getManagerRoleLabel('hr')).toBe('HR-менеджер')
    expect(getManagerRoleLabel('manager')).toBe('Управляющий')
  })

  it('returns fallback for unknown role', () => {
    expect(getManagerRoleLabel('supervisor')).toBe('supervisor')
  })

  it('returns default fallback when role is empty or null', () => {
    expect(getManagerRoleLabel(null)).toBe('Менеджер')
    expect(getManagerRoleLabel(undefined)).toBe('Менеджер')
  })
})
