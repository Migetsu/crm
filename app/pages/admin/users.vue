<template lang="pug">
.page-users
  .page-users__header
    div
      h1.page-title Управление пользователями
      p.page-subtitle Сотрудники, ролевая модель (RBAC) и права доступа
    UiButton(
      v-if="canManage",
      variant="primary",
      @click="openCreateModal"
    )
      template(#icon)
        Plus(:size="18")
      | Добавить пользователя

  //- Filters Bar
  .page-users__filters
    .candidate-search__input-wrapper.page-users__search
      Search.candidate-search__icon(:size="16")
      input.candidate-search__input(
        v-model="searchQuery",
        placeholder="Поиск по ФИО или email..."
      )

    .page-users__filter-selects
      UiSelect(
        v-model="selectedRoleFilter",
        :options="roleFilterOptions",
        placeholder="Все роли"
      )
      UiSelect(
        v-model="selectedStatusFilter",
        :options="statusFilterOptions",
        placeholder="Все статусы"
      )

  //- Loading & Empty states
  .page-users__list(v-if="usersStore.isLoading && !usersStore.users.length", aria-hidden="true")
    .user-card(v-for="i in 4", :key="i", style="pointer-events: none;")
      .user-card__left(style="width: 100%; display: flex; align-items: center; gap: 16px;")
        UiSkeleton(width="48px", height="48px", border-radius="50%", variant="circle")
        .user-card__info(style="display: flex; flex-direction: column; gap: 8px; flex: 1;")
          .user-card__title-row(style="display: flex; gap: 12px;")
            UiSkeleton(width="200px", height="18px")
            UiSkeleton(width="90px", height="18px", border-radius="12px")
          .user-card__meta(style="display: flex; gap: 16px;")
            UiSkeleton(width="140px", height="14px")
            UiSkeleton(width="110px", height="14px")
      .user-card__actions(style="display: flex; gap: 8px;")
        UiSkeleton(width="110px", height="32px", border-radius="6px")
        UiSkeleton(width="120px", height="32px", border-radius="6px")

  .page-vacancies__empty(v-else-if="filteredUsers.length === 0")
    UsersIcon(:size="48")
    p Пользователи не найдены
    p.page-users__empty-hint Попробуйте изменить параметры поиска или фильтров

  //- Users List
  .page-users__list(v-else)
    .user-card(
      v-for="u in filteredUsers",
      :key="u.id",
      :class="{ 'user-card--blocked': u.is_active === false }"
    )
      .user-card__left
        .user-card__avatar(:class="`user-card__avatar--${u.role}`")
          | {{ getInitials(u.full_name) }}
        .user-card__info
          .user-card__title-row
            span.user-card__name {{ u.full_name }}
            span.user-card__you-badge(v-if="u.id === authStore.profile?.id") Вы
          span.user-card__email {{ u.email }}
          span.user-card__date Зарегистрирован: {{ formatDate(u.created_at) }}

      .user-card__right
        //- Status badge
        .user-card__status-badge(
          :class="u.is_active === false ? 'user-card__status-badge--blocked' : 'user-card__status-badge--active'"
        )
          component(:is="u.is_active === false ? ShieldAlert : ShieldCheck", :size="13")
          span {{ u.is_active === false ? 'Заблокирован' : 'Активен' }}

        //- Role Badge
        .user-card__role-wrapper
          span.user-card__role(:class="`user-card__role--${u.role}`")
            | {{ roleLabel(u.role) }}

        //- Action Buttons
        .user-card__actions(v-if="canManage")
          UiButton(
            v-if="canEditUser(u)",
            variant="ghost",
            size="sm",
            title="Изменить роль",
            @click="openRoleModal(u)"
          )
            template(#icon)
              UserCog(:size="14")
            | Роль

          UiButton(
            v-if="u.id !== authStore.profile?.id && canEditUser(u)",
            :variant="u.is_active === false ? 'secondary' : 'ghost'",
            size="sm",
            :title="u.is_active === false ? 'Разблокировать' : 'Заблокировать'",
            @click="openToggleModal(u)"
          )
            template(#icon)
              component(:is="u.is_active === false ? UserCheck : UserX", :size="14")
            | {{ u.is_active === false ? 'Разблокировать' : 'Блокировать' }}

  //- Modal: Create New User
  UiModal(v-model="showCreateModal", title="Создание пользователя", size="md")
    .user-form
      UiInput(
        v-model="newUser.fullName",
        label="ФИО сотрудника *",
        placeholder="Иванов Петр Сергеевич"
      )
      UiInput(
        v-model="newUser.email",
        label="Email (логин) *",
        placeholder="petr.ivanov@crm.ru"
      )
      .user-form__password-field
        UiInput(
          v-model="newUser.password",
          label="Временный пароль *",
          placeholder="Минимум 6 символов"
        )
        UiButton(
          variant="secondary",
          size="sm",
          type="button",
          @click="generateRandomPassword"
        )
          template(#icon)
            Key(:size="14")
          | Сгенерировать

      UiSelect(
        v-model="newUser.role",
        label="Роль в системе *",
        :options="creatableRoleOptions"
      )

      .user-form__notice
        p Новый пользователь сможет войти в систему по указанному email и паролю с правами назначенной роли.

    template(#footer)
      UiButton(variant="secondary", @click="showCreateModal = false") Отмена
      UiButton(
        variant="primary",
        :disabled="!isNewUserValid || isSubmitting",
        @click="handleCreateUser"
      )
        | {{ isSubmitting ? 'Создание...' : 'Создать учетную запись' }}

  //- Modal: Change Role
  UiModal(
    v-model="showRoleModal",
    :title="selectedUser ? `Изменение роли: ${selectedUser.full_name}` : 'Изменение роли'",
    size="sm"
  )
    .user-form(v-if="selectedUser")
      UiSelect(
        v-model="targetRole",
        label="Новая роль сотрудника *",
        :options="creatableRoleOptions"
      )
    template(#footer)
      UiButton(variant="secondary", @click="showRoleModal = false") Отмена
      UiButton(
        variant="primary",
        :disabled="!targetRole || targetRole === selectedUser?.role || isSubmitting",
        @click="handleSaveRole"
      )
        | {{ isSubmitting ? 'Сохранение...' : 'Сохранить роль' }}

  //- Modal: Toggle Active / Block confirmation
  UiModal(
    v-model="showToggleModal",
    :title="toggleTargetUser?.is_active === false ? 'Разблокировка пользователя' : 'Блокировка пользователя'",
    size="sm"
  )
    .user-form(v-if="toggleTargetUser")
      p.user-form__confirm-text
        | Вы уверены, что хотите 
        strong {{ toggleTargetUser.is_active === false ? 'разблокировать' : 'заблокировать' }}
        |  пользователя 
        strong {{ toggleTargetUser.full_name }}
        |  ({{ toggleTargetUser.email }})?
      p.user-form__confirm-hint(v-if="toggleTargetUser.is_active !== false")
        | Заблокированный сотрудник не сможет авторизоваться в системе.
    template(#footer)
      UiButton(variant="secondary", @click="showToggleModal = false") Отмена
      UiButton(
        :variant="toggleTargetUser?.is_active === false ? 'primary' : 'danger'",
        :disabled="isSubmitting",
        @click="confirmToggleActive"
      )
        | {{ isSubmitting ? 'Выполнение...' : (toggleTargetUser?.is_active === false ? 'Разблокировать' : 'Заблокировать') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Plus, Search, ShieldCheck, ShieldAlert, UserCheck,
  UserX, UserCog, Key, Users as UsersIcon,
} from 'lucide-vue-next'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useUsersStore } from '~/stores/users.store'
import { useAuthStore } from '~/stores/auth.store'
import { useToast } from '~/composables/useToast'
import UiSkeleton from '~/components/ui/UiSkeleton/UiSkeleton.vue'
import { ROLE_LABELS, canManageAccounts, canModifyUser } from '~/types/user.types'
import type { UserRole, Profile } from '~/types/user.types'

const usersStore = useUsersStore()
const authStore = useAuthStore()
const toast = useToast()

const searchQuery = ref('')
const selectedRoleFilter = ref('all')
const selectedStatusFilter = ref('all')

const showCreateModal = ref(false)
const showRoleModal = ref(false)
const showToggleModal = ref(false)
const selectedUser = ref<Profile | null>(null)
const toggleTargetUser = ref<Profile | null>(null)
const targetRole = ref<UserRole>('operator')
const isSubmitting = ref(false)

const newUser = reactive({
  fullName: '',
  email: '',
  password: '',
  role: 'operator' as UserRole,
})

const canManage = computed(() => {
  return canManageAccounts(authStore.profile?.role)
})

const isSuperAdmin = computed(() => {
  return authStore.profile?.role === 'superadmin'
})

const roleFilterOptions = [
  { value: 'all', label: 'Все роли' },
  { value: 'operator', label: 'Операторы' },
  { value: 'operator_director', label: 'Директора' },
  { value: 'admin', label: 'Администраторы' },
  { value: 'superadmin', label: 'Супер Админы' },
]

const statusFilterOptions = [
  { value: 'all', label: 'Все статусы' },
  { value: 'active', label: 'Только активные' },
  { value: 'blocked', label: 'Заблокированные' },
]

const creatableRoleOptions = computed(() => {
  const options = [
    { value: 'operator', label: 'Оператор (базовый доступ к кандидатам)' },
    { value: 'operator_director', label: 'Директор (доступ к кандидатам и вакансиям)' },
  ]
  if (isSuperAdmin.value) {
    options.push(
      { value: 'admin', label: 'Администратор (управление базой и учетными записями)' },
      { value: 'superadmin', label: 'Супер Админ (полный доступ ко всем функциям)' },
    )
  }
  return options
})

const isNewUserValid = computed(() => {
  return (
    newUser.fullName.trim().length > 0 &&
    newUser.email.trim().includes('@') &&
    newUser.password.length >= 6
  )
})

const filteredUsers = computed(() => {
  return usersStore.users.filter((u) => {
    // Search query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const matchName = u.full_name?.toLowerCase().includes(q)
      const matchEmail = u.email?.toLowerCase().includes(q)
      if (!matchName && !matchEmail) return false
    }

    // Role filter
    if (selectedRoleFilter.value !== 'all' && u.role !== selectedRoleFilter.value) {
      return false
    }

    // Status filter
    if (selectedStatusFilter.value === 'active' && u.is_active === false) {
      return false
    }
    if (selectedStatusFilter.value === 'blocked' && u.is_active !== false) {
      return false
    }

    return true
  })
})

onMounted(async () => {
  await usersStore.fetchAll()
})

const canEditUser = (target: Profile): boolean => {
  return canModifyUser(authStore.profile?.role, target.role)
}

const getInitials = (name?: string) => {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0]?.[0]?.toUpperCase() || 'U'
}

const roleLabel = (role: string) => ROLE_LABELS[role as UserRole] || role

const formatDate = (isoString?: string) => {
  if (!isoString) return ''
  try {
    return format(parseISO(isoString), 'd MMMM yyyy', { locale: ru })
  } catch {
    return isoString
  }
}

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
  let pass = ''
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  newUser.password = pass
}

const openCreateModal = () => {
  newUser.fullName = ''
  newUser.email = ''
  newUser.password = '123456'
  newUser.role = 'operator'
  showCreateModal.value = true
}

const handleCreateUser = async () => {
  if (!isNewUserValid.value) return
  isSubmitting.value = true
  try {
    await usersStore.createUser({
      email: newUser.email.trim(),
      password: newUser.password,
      fullName: newUser.fullName.trim(),
      role: newUser.role,
    })
    showCreateModal.value = false
    toast.success('Пользователь успешно создан')
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Ошибка при создании пользователя')
  } finally {
    isSubmitting.value = false
  }
}

const openRoleModal = (u: Profile) => {
  selectedUser.value = u
  targetRole.value = u.role
  showRoleModal.value = true
}

const handleSaveRole = async () => {
  if (!selectedUser.value || !targetRole.value) return
  isSubmitting.value = true
  try {
    await usersStore.updateRole(selectedUser.value.id, targetRole.value)
    showRoleModal.value = false
    toast.success('Роль пользователя успешно изменена')
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Ошибка при смене роли')
  } finally {
    isSubmitting.value = false
  }
}

const openToggleModal = (u: Profile) => {
  toggleTargetUser.value = u
  showToggleModal.value = true
}

const confirmToggleActive = async () => {
  if (!toggleTargetUser.value) return
  const willBeActive = toggleTargetUser.value.is_active === false
  isSubmitting.value = true
  try {
    await usersStore.toggleActive(toggleTargetUser.value.id, willBeActive)
    showToggleModal.value = false
    toast.success(willBeActive ? 'Пользователь успешно разблокирован' : 'Пользователь успешно заблокирован')
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Ошибка при изменении статуса')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style lang="scss">
.page-users {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-6);
  }

  &__filters {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: var(--spacing-4);
    flex-wrap: wrap;
  }

  &__search {
    flex: 1;
    min-width: 260px;
  }

  &__filter-selects {
    display: flex;
    gap: 10px;
    min-width: 320px;
  }

  &__empty-hint {
    font-size: 13px;
    color: var(--color-text-muted);
  }
  
  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
  }

  &--blocked {
    opacity: 0.75;
    background-color: rgba(239, 68, 68, 0.03);
    border-color: rgba(239, 68, 68, 0.3);
  }
  
  &__left {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  
  &__avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 15px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);

    &--superadmin {
      background: linear-gradient(135deg, #8b5cf6, #ec4899);
    }

    &--admin {
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
    }

    &--operator_director {
      background: linear-gradient(135deg, #f59e0b, #ea580c);
    }

    &--operator {
      background: linear-gradient(135deg, #10b981, #059669);
    }
  }
  
  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  &__name {
    font-weight: 600;
    font-size: 15px;
    color: var(--color-text-primary);
  }

  &__you-badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 6px;
    border-radius: 9999px;
    background-color: var(--color-primary);
    color: white;
  }
  
  &__email {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  &__date {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  &__status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 600;

    &--active {
      background-color: rgba(16, 185, 129, 0.12);
      color: #10b981;
    }

    &--blocked {
      background-color: rgba(239, 68, 68, 0.12);
      color: #ef4444;
    }
  }
  
  &__role {
    padding: 4px 12px;
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 600;

    &--superadmin {
      background-color: rgba(139, 92, 246, 0.15);
      color: #8b5cf6;
    }

    &--admin {
      background-color: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
    }

    &--operator_director {
      background-color: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }

    &--operator {
      background-color: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__password-field {
    display: flex;
    align-items: flex-end;
    gap: 8px;

    .ui-input {
      flex: 1;
    }
  }

  &__notice {
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.4;
  }

  &__confirm-text {
    font-size: 14px;
    color: var(--color-text-primary);
    line-height: 1.5;
    margin: 0;
  }

  &__confirm-hint {
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 0;
  }
}
</style>
