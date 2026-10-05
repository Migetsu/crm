import { describe, it, expect } from 'vitest'
import {
  ROLE_LABELS,
  CAN_MANAGE_ACCOUNTS,
  CAN_CREATE_ADMINS,
  canManageAccounts,
  canCreateAdmins,
  canModifyUser,
} from '~/types/user.types'

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

    expect(canManageAccounts('admin')).toBe(true)
    expect(canManageAccounts('superadmin')).toBe(true)
    expect(canManageAccounts('operator')).toBe(false)
    expect(canManageAccounts('operator_director')).toBe(false)
    expect(canManageAccounts(null)).toBe(false)
  })

  it('should only allow superadmin to create admins', () => {
    expect(CAN_CREATE_ADMINS).toEqual(['superadmin'])
    expect(canCreateAdmins('superadmin')).toBe(true)
    expect(canCreateAdmins('admin')).toBe(false)
    expect(canCreateAdmins('operator')).toBe(false)
  })

  it('should validate hierarchy in canModifyUser', () => {
    expect(canModifyUser('superadmin', 'admin')).toBe(true)
    expect(canModifyUser('superadmin', 'operator')).toBe(true)
    expect(canModifyUser('superadmin', 'superadmin')).toBe(true)

    expect(canModifyUser('admin', 'operator')).toBe(true)
    expect(canModifyUser('admin', 'operator_director')).toBe(true)
    expect(canModifyUser('admin', 'admin')).toBe(false)
    expect(canModifyUser('admin', 'superadmin')).toBe(false)

    expect(canModifyUser('operator', 'operator')).toBe(false)
    expect(canModifyUser(null, 'operator')).toBe(false)
  })
})
