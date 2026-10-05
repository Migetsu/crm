import type { ManagerRole } from '~/types/org-unit.types'
import { MANAGER_ROLE_LABELS } from '~/types/org-unit.types'

/**
 * Returns a human-readable Russian label for a manager role.
 */
export const getManagerRoleLabel = (role?: ManagerRole | string | null): string => {
  if (!role) return 'Менеджер'
  const knownRole = role as ManagerRole
  return MANAGER_ROLE_LABELS[knownRole] || role
}
