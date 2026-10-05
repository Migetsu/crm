import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth.store'
import type { UserRole } from '~/types/user.types'
import {
  ROLE_LABELS,
  canManageAccounts,
  canCreateAdmins,
  canModifyUser,
  canDeleteUser,
  canViewVacancies,
  canViewOrgUnits,
  canToggleVacancy,
  canCreateVacancy,
  canCreateOrgUnit,
  canDeleteCandidate,
} from '~/types/user.types'

export const useRolePermissions = () => {
  const authStore = useAuthStore()

  const role = computed<UserRole>(() => authStore.profile?.role || 'operator')
  const roleLabel = computed(() => ROLE_LABELS[role.value] || role.value)

  const isOperator = computed(() => role.value === 'operator')
  const isDirector = computed(() => role.value === 'operator_director')
  const isAdmin = computed(() => role.value === 'admin')
  const isSuperAdmin = computed(() => role.value === 'superadmin')

  // Navigation & Page permissions
  const canSeeCandidates = computed(() => true)
  const canSeeTemplates = computed(() => true)
  const canSeeCompany = computed(() => true)
  const canSeeVacancies = computed(() => canViewVacancies(role.value))
  const canSeeOrgUnits = computed(() => canViewOrgUnits(role.value))
  const canSeeAdminUsers = computed(() => canManageAccounts(role.value))

  // Action permissions
  const canToggleVacancyStatus = computed(() => canToggleVacancy(role.value))
  const canAddNewVacancy = computed(() => canCreateVacancy(role.value))
  const canAddNewOrgUnit = computed(() => canCreateOrgUnit(role.value))
  const canRemoveCandidate = computed(() => canDeleteCandidate(role.value))
  const canCreateNewAdmins = computed(() => canCreateAdmins(role.value))

  const checkCanModifyUser = (targetRole?: string | null) => {
    return canModifyUser(role.value, targetRole)
  }

  const checkCanDeleteUser = (targetRole?: string | null, isSelf = false) => {
    return canDeleteUser(role.value, targetRole, isSelf)
  }

  return {
    role,
    roleLabel,
    isOperator,
    isDirector,
    isAdmin,
    isSuperAdmin,
    canSeeCandidates,
    canSeeTemplates,
    canSeeCompany,
    canSeeVacancies,
    canSeeOrgUnits,
    canSeeAdminUsers,
    canToggleVacancyStatus,
    canAddNewVacancy,
    canAddNewOrgUnit,
    canRemoveCandidate,
    canCreateNewAdmins,
    checkCanModifyUser,
    checkCanDeleteUser,
  }
}
