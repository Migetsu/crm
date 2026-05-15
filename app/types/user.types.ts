export type UserRole = 'operator' | 'operator_director' | 'admin' | 'superadmin'

export interface User {
  id: string
  email: string
  role: UserRole
  fullName: string
  createdAt: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  theme?: string
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
