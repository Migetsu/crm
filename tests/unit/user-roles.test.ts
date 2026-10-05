import { describe, it, expect } from 'vitest'
import { ROLE_LABELS, CAN_MANAGE_ACCOUNTS, CAN_CREATE_ADMINS } from '~/types/user.types'

describe('User Types & Permissions', () => {
  it('should have labels defined for all user roles', () => {
    expect(ROLE_LABELS.operator).toBe('Оператор')
    expect(ROLE_LABELS.operator_director).toBe('Директор')
    expect(ROLE_LABELS.admin).toBe('Администратор')
    expect(ROLE_LABELS.superadmin).toBe('Супер Админ')
  })

  it('should correctly restrict account management permissions', () => {
    expect(CAN_MANAGE_ACCOUNTS).toContain('admin')
    expect(CAN_MANAGE_ACCOUNTS).toContain('superadmin')
    expect(CAN_MANAGE_ACCOUNTS).not.toContain('operator')
    expect(CAN_MANAGE_ACCOUNTS).not.toContain('operator_director')
  })

  it('should only allow superadmin to create admins', () => {
    expect(CAN_CREATE_ADMINS).toEqual(['superadmin'])
  })
})
