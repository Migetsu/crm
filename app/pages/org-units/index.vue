<template lang="pug">
.page-org-units
  .page-org-units__header
    div
      h1.page-title Организационные единицы
      p.page-subtitle Филиалы, торговые точки и закрепленные менеджеры
    UiButton(v-if="permissions.canAddNewOrgUnit.value", variant="primary", @click="showCreateModal = true")
      template(#icon)
        Plus(:size="18")
      | Добавить подразделение
      
  .page-org-units__search
    .page-org-units__search-wrapper
      Search.page-org-units__search-icon(:size="16")
      input.page-org-units__search-input(
        v-model="searchQuery",
        placeholder="Поиск по названию, адресу или директору...",
        @input="debouncedSearch"
      )
      button.page-org-units__search-clear(
        v-if="searchQuery",
        type="button",
        title="Очистить поиск",
        @click="clearSearch"
      )
        X(:size="14")
      
  .page-org-units__list(v-if="orgUnitsStore.isLoading && !orgUnitsStore.orgUnits.length", aria-hidden="true")
    .org-unit-card(v-for="i in 3", :key="i", style="pointer-events: none;")
      .org-unit-card__header
        .org-unit-card__title-row(style="display: flex; gap: 12px; width: 60%;")
          UiSkeleton(width="220px", height="22px")
          UiSkeleton(width="80px", height="20px", border-radius="12px")
        .org-unit-card__actions
          UiSkeleton(width="140px", height="32px", border-radius="6px")
      .org-unit-card__body(style="margin-top: 14px; display: flex; flex-direction: column; gap: 10px;")
        UiSkeleton(width="70%", height="14px")
        UiSkeleton(width="50%", height="14px")
    
  .page-org-units__empty(v-else-if="orgUnitsStore.orgUnits.length === 0")
    MapPin(:size="48")
    p Подразделения не найдены
    p.page-org-units__empty-hint Попробуйте изменить параметры поиска
    
  .page-org-units__list(v-else)
    .org-unit-card(v-for="unit in orgUnitsStore.orgUnits", :key="unit.id")
      .org-unit-card__header
        .org-unit-card__title-row
          NuxtLink.org-unit-card__name(:to="`/org-units/${unit.id}`") {{ unit.name }}
          span.org-unit-card__category(v-if="unit.category") {{ unit.category }}
        .org-unit-card__actions
          NuxtLink.org-unit-card__vacancies-btn(:to="`/org-units/${unit.id}`")
            | Вакансии магазина ▶
          UiButton(variant="secondary", size="sm", @click="openManagersModal(unit)")
            template(#icon)
              Users(:size="14")
            | Менеджеры ({{ unit.managers?.length || 0 }})
            
      .org-unit-card__body
        .org-unit-card__info-group
          .org-unit-card__meta-item
            MapPin(:size="15")
            span {{ unit.interview_address }}
          .org-unit-card__meta-item
            UserCheck(:size="15")
            span Директор: 
              strong {{ unit.director_full_name }}
              span.org-unit-card__contact(v-if="unit.director_phone")  ({{ unit.director_phone }}, {{ unit.director_email }})
              
        .org-unit-card__managers(v-if="unit.managers && unit.managers.length > 0")
          h4.org-unit-card__managers-title Закрепленные менеджеры и HR:
          .org-unit-card__manager-chips
            .manager-chip(v-for="mgr in unit.managers", :key="mgr.id", :class="`manager-chip--${mgr.role || 'director'}`")
              span.manager-chip__role {{ getManagerRoleLabel(mgr.role) }}
              span.manager-chip__name {{ mgr.full_name }}
              span.manager-chip__phone(v-if="mgr.phone") {{ mgr.phone }}

  //- Modal: Manage unit managers
  UiModal(
    v-model="showManagersModal",
    :title="activeUnit ? `Менеджеры: ${activeUnit.name}` : 'Управление менеджерами'",
    size="lg"
  )
    .unit-managers-modal(v-if="activeUnit")
      .unit-managers-modal__current
        h4.unit-managers-modal__section-title Назначенные специалисты
        .unit-managers-modal__empty(v-if="!activeUnit.managers || activeUnit.managers.length === 0")
          p В данное подразделение еще не назначены HR или менеджеры.
        .unit-managers-modal__list(v-else)
          .unit-manager-item(v-for="mgr in activeUnit.managers", :key="mgr.id")
            .unit-manager-item__main
              span.unit-manager-item__badge(:class="`unit-manager-item__badge--${mgr.role || 'director'}`")
                | {{ getManagerRoleLabel(mgr.role) }}
              span.unit-manager-item__name {{ mgr.full_name }}
            .unit-manager-item__contacts
              span.unit-manager-item__contact(v-if="mgr.email") {{ mgr.email }}
              span.unit-manager-item__contact(v-if="mgr.phone") {{ mgr.phone }}
            UiButton(
              variant="ghost",
              size="sm",
              title="Удалить менеджера",
              @click="handleRemoveManager(mgr.id)"
            )
              Trash2(:size="15")

      .unit-managers-modal__add
        h4.unit-managers-modal__section-title Добавить менеджера или HR
        .unit-managers-modal__form
          UiSelect(
            v-model="newManager.role",
            :options="roleOptions",
            label="Роль *"
          )
          UiInput(
            v-model="newManager.full_name",
            label="ФИО сотрудника *",
            placeholder="Иванов Петр Алексеевич"
          )
          UiInput(
            v-model="newManager.email",
            label="Email *",
            placeholder="petr.ivanov@retail.ru"
          )
          UiInput(
            v-model="newManager.phone",
            label="Телефон *",
            placeholder="+7 (900) 123-45-67"
          )
        .unit-managers-modal__form-actions
          UiButton(
            variant="primary",
            :disabled="!isNewManagerValid",
            @click="handleAddManager"
          )
            template(#icon)
              Plus(:size="16")
            | Назначить в подразделение

    template(#footer)
      UiButton(variant="secondary", @click="showManagersModal = false") Закрыть

  //- Modal: Create Org Unit (simplified 2-step layout)
  UiModal(v-model="showCreateModal", title="Новая организационная единица", size="lg")
    .org-unit-form
      .org-unit-form__section
        h4.org-unit-form__section-title 1. Основные данные филиала
        .org-unit-form__grid
          UiInput(
            v-model="newUnit.name",
            label="Название подразделения / магазина *",
            placeholder="Пятёрочка №6702, Москва"
          )
          UiInput(
            v-model="newUnit.category",
            label="Категория / Город",
            placeholder="Москва, Ритейл"
          )
        UiInput(
          v-model="newUnit.interview_address",
          label="Адрес проведения собеседований *",
          placeholder="г. Москва, ул. Ленина, д. 10"
        )

      .org-unit-form__section
        h4.org-unit-form__section-title 2. Директор филиала
        .org-unit-form__grid
          UiInput(
            v-model="newUnit.director_full_name",
            label="ФИО директора *",
            placeholder="Петров Иван Сергеевич"
          )
          UiInput(
            v-model="newUnit.director_phone",
            label="Телефон директора *",
            placeholder="+7 (900) 000-00-00"
          )
        UiInput(
          v-model="newUnit.director_email",
          label="Email директора *",
          placeholder="director@example.com"
        )

      .org-unit-form__section
        .org-unit-form__section-header
          h4.org-unit-form__section-title 3. Руководство кластера / округа
          span.org-unit-form__optional (необязательно)
        .org-unit-form__grid
          UiInput(
            v-model="newUnit.cluster_director_full_name",
            label="ФИО директора кластера",
            placeholder="Сидоров Алексей (если отличается)"
          )
          UiInput(
            v-model="newUnit.cluster_director_email",
            label="Email директора кластера",
            placeholder="cluster@example.com"
          )

    template(#footer)
      UiButton(variant="secondary", @click="showCreateModal = false") Отмена
      UiButton(variant="primary", :disabled="!isNewUnitValid", @click="createUnit") Создать подразделение
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Search, X, MapPin, Users, UserCheck, Trash2 } from 'lucide-vue-next'
import { useOrgUnitsStore } from '~/stores/org-units.store'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'
import UiSkeleton from '~/components/ui/UiSkeleton/UiSkeleton.vue'
import type { OrgUnit, ManagerRole } from '~/types/org-unit.types'
import { getManagerRoleLabel } from '~/utils/manager-roles'

const orgUnitsStore = useOrgUnitsStore()
const toast = useToast()
const confirm = useConfirm()
const permissions = useRolePermissions()
const searchQuery = ref('')
const showCreateModal = ref(false)
const showManagersModal = ref(false)
const activeUnit = ref<OrgUnit | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const roleOptions = [
  { value: 'director', label: 'Директор филиала' },
  { value: 'hr', label: 'HR-менеджер' },
  { value: 'manager', label: 'Управляющий' },
]

const newManager = reactive({
  role: 'hr' as ManagerRole,
  full_name: '',
  email: '',
  phone: '',
})

const isNewManagerValid = computed(() => {
  return (
    newManager.full_name.trim().length > 0 &&
    newManager.email.trim().length > 0 &&
    newManager.phone.trim().length > 0
  )
})

const newUnit = reactive({
  name: '',
  category: '',
  interview_address: '',
  director_full_name: '',
  director_email: '',
  director_phone: '',
  cluster_director_full_name: '',
  cluster_director_email: '',
})

const isNewUnitValid = computed(() => {
  return (
    newUnit.name.trim().length > 0 &&
    newUnit.interview_address.trim().length > 0 &&
    newUnit.director_full_name.trim().length > 0 &&
    newUnit.director_phone.trim().length > 0 &&
    newUnit.director_email.trim().length > 0
  )
})

onMounted(async () => {
  await orgUnitsStore.fetchAll()
})

const debouncedSearch = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    orgUnitsStore.search(searchQuery.value)
  }, 300)
}

const clearSearch = () => {
  searchQuery.value = ''
  if (debounceTimer) clearTimeout(debounceTimer)
  orgUnitsStore.search('')
}

const openManagersModal = (unit: OrgUnit) => {
  activeUnit.value = unit
  newManager.role = 'hr'
  newManager.full_name = ''
  newManager.email = ''
  newManager.phone = ''
  showManagersModal.value = true
}

const handleAddManager = async () => {
  if (!activeUnit.value || !isNewManagerValid.value) return
  try {
    await orgUnitsStore.addManager({
      org_unit_id: activeUnit.value.id,
      full_name: newManager.full_name.trim(),
      email: newManager.email.trim(),
      phone: newManager.phone.trim(),
      role: newManager.role,
    })
    newManager.full_name = ''
    newManager.email = ''
    newManager.phone = ''
    toast.success('Сотрудник успешно прикреплен к подразделению')
  } catch (err: unknown) {
    toast.error('Не удалось добавить сотрудника')
    console.error(err)
  }
}

const handleRemoveManager = async (managerId: string) => {
  if (!activeUnit.value) return
  const confirmed = await confirm.confirm({
    title: 'Удаление сотрудника',
    message: 'Вы уверены, что хотите открепить этого сотрудника от подразделения?',
    confirmText: 'Открепить',
    cancelText: 'Отмена',
    variant: 'danger',
    icon: 'trash',
  })
  if (!confirmed) return

  try {
    await orgUnitsStore.removeManager(activeUnit.value.id, managerId)
    toast.success('Сотрудник успешно откреплен')
  } catch (err: unknown) {
    toast.error('Не удалось открепить сотрудника')
    console.error(err)
  }
}

const createUnit = async () => {
  if (!isNewUnitValid.value) return

  const clusterDirectorName = newUnit.cluster_director_full_name.trim() || newUnit.director_full_name.trim()
  const clusterDirectorEmail = newUnit.cluster_director_email.trim() || newUnit.director_email.trim()

  try {
    await orgUnitsStore.create({
      name: newUnit.name.trim(),
      category: newUnit.category.trim() || null,
      interview_address: newUnit.interview_address.trim(),
      director_full_name: newUnit.director_full_name.trim(),
      director_email: newUnit.director_email.trim(),
      director_phone: newUnit.director_phone.trim(),
      cluster_director_full_name: clusterDirectorName,
      cluster_director_email: clusterDirectorEmail,
      hr_full_name: null,
      hr_email: null,
      hr_phone: null,
      regional_office: null,
      territory: null,
      macroregion: null,
      division: null,
      cluster: null,
      sap_id: null,
      cfo: null,
      opened_at: null,
      timezone: 'Europe/Moscow',
      actual_location: null,
    })

    showCreateModal.value = false
    Object.assign(newUnit, {
      name: '',
      category: '',
      interview_address: '',
      director_full_name: '',
      director_email: '',
      director_phone: '',
      cluster_director_full_name: '',
      cluster_director_email: '',
    })
    toast.success('Подразделение успешно создано')
  } catch (err: unknown) {
    toast.error('Не удалось создать подразделение')
    console.error(err)
  }
}
</script>

<style lang="scss">
.page-org-units {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-6);
  }
  
  &__search {
    margin-bottom: var(--spacing-6);
  }

  &__search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 480px;
  }

  &__search-icon {
    position: absolute;
    left: 14px;
    color: var(--color-text-secondary);
    pointer-events: none;
  }

  &__search-input {
    width: 100%;
    padding: 10px 38px 10px 38px;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 14px;
    outline: none;
    transition: all 0.2s ease;

    &:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    &::placeholder {
      color: var(--color-text-muted);
    }
  }

  &__search-clear {
    position: absolute;
    right: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    color: var(--color-text-secondary);
    gap: 8px;

    p {
      font-size: 16px;
      font-weight: 500;
      color: var(--color-text-primary);
      margin: 0;
    }
  }

  &__empty-hint {
    font-size: 14px;
    color: var(--color-text-muted);
  }
  
  &__list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.org-unit-card {
  padding: 18px 22px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--color-primary);
  }
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  &__name {
    font-size: 17px;
    font-weight: 600;
    color: var(--color-text-primary);
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: var(--color-primary);
      text-decoration: underline;
    }
  }

  &__vacancies-btn {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-primary);
    text-decoration: none;
    padding: 6px 12px;
    border-radius: var(--radius-md);
    background-color: rgba(59, 130, 246, 0.1);
    transition: all 0.2s;

    &:hover {
      background-color: var(--color-primary);
      color: white;
    }
  }

  &__category {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 8px;
    border-radius: 9999px;
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  &__body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__info-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  &__meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--color-text-secondary);

    strong {
      color: var(--color-text-primary);
    }
  }

  &__contact {
    color: var(--color-text-muted);
  }

  &__managers {
    padding-top: 10px;
    border-top: 1px dashed var(--color-border);
  }

  &__managers-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-muted);
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  &__manager-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.manager-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);

  &__role {
    font-weight: 600;
  }

  &--director {
    border-color: rgba(59, 130, 246, 0.4);
    .manager-chip__role {
      color: #3b82f6;
    }
  }

  &--hr {
    border-color: rgba(16, 185, 129, 0.4);
    .manager-chip__role {
      color: #10b981;
    }
  }

  &--manager {
    border-color: rgba(245, 158, 11, 0.4);
    .manager-chip__role {
      color: #f59e0b;
    }
  }

  &__name {
    color: var(--color-text-primary);
    font-weight: 500;
  }

  &__phone {
    color: var(--color-text-muted);
  }
}

.unit-managers-modal {
  display: flex;
  flex-direction: column;
  gap: 20px;

  &__section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 10px;
  }

  &__empty {
    padding: 16px;
    border-radius: var(--radius-md);
    background-color: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    font-size: 13px;
    text-align: center;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__add {
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
  }

  &__form {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 12px;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  &__form-actions {
    display: flex;
    justify-content: flex-end;
  }
}

.unit-manager-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  gap: 12px;

  &__main {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__name {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  &__badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;

    &--director {
      background-color: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
    }

    &--hr {
      background-color: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }

    &--manager {
      background-color: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }
  }

  &__contacts {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-left: auto;
  }
}

.org-unit-form {
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--color-border);

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }

  &__section-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  &__optional {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
}
</style>
