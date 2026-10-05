export type UserRole = 'operator' | 'operator_director' | 'admin' | 'superadmin'

export interface User {
  id: string
  email: string
  role: UserRole
  fullName: string
  createdAt: string
  isActive?: boolean
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  theme?: string
  is_active?: boolean
  created_at: string
}

/** Access matrix for roles */
export const ROLE_LABELS: Record<UserRole, string> = {
  operator: 'Оператор',
  operator_director: 'Директор',
  admin: 'Администратор',
  superadmin: 'Супер Админ',
}

export const CAN_MANAGE_ACCOUNTS: UserRole[] = ['admin', 'superadmin']
export const CAN_CREATE_ADMINS: UserRole[] = ['superadmin']

export const canManageAccounts = (role?: string | null): boolean => {
  return role === 'admin' || role === 'superadmin'
}

export const canCreateAdmins = (role?: string | null): boolean => {
  return role === 'superadmin'
}

export const canModifyUser = (callerRole?: string | null, targetRole?: string | null): boolean => {
  if (!callerRole) return false
  if (callerRole === 'superadmin') return true
  if (callerRole === 'admin') {
    return targetRole === 'operator' || targetRole === 'operator_director'
  }
  return false
}

export const canDeleteUser = (callerRole?: string | null, targetRole?: string | null, isSelf = false): boolean => {
  if (isSelf) return false
  if (!callerRole || !targetRole) return false
  if (targetRole === 'superadmin') return false
  if (callerRole === 'superadmin') return true
  if (callerRole === 'admin') {
    return targetRole === 'operator' || targetRole === 'operator_director'
  }
  return false
}

export const canViewVacancies = (role?: string | null): boolean => {
  return role === 'operator_director' || role === 'admin' || role === 'superadmin'
}

export const canViewOrgUnits = (role?: string | null): boolean => {
  return role === 'operator_director' || role === 'admin' || role === 'superadmin'
}

export const canToggleVacancy = (role?: string | null): boolean => {
  return role === 'operator_director' || role === 'admin' || role === 'superadmin'
}

export const canCreateVacancy = (role?: string | null): boolean => {
  return role === 'admin' || role === 'superadmin'
}

export const canCreateOrgUnit = (role?: string | null): boolean => {
  return role === 'admin' || role === 'superadmin'
}

export const canDeleteCandidate = (role?: string | null): boolean => {
  return role === 'admin' || role === 'superadmin'
}

