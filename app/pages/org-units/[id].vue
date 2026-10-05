<template lang="pug">
.page-org-unit(v-if="unit")
  .page-org-unit__top
    button.page-org-unit__back(@click="$router.push('/org-units')")
      ArrowLeft(:size="18")
      | Назад к подразделениям

  //- Main Info Card
  .page-org-unit__header-card
    .page-org-unit__main-info
      .page-org-unit__title-row
        h1.page-title {{ unit.name }}
        span.page-org-unit__category(v-if="unit.category") {{ unit.category }}
      
      .page-org-unit__address
        MapPin(:size="16")
        span {{ unit.interview_address }}

    .page-org-unit__contacts-grid
      .page-org-unit__contact-card
        .page-org-unit__contact-header
          UserCheck(:size="16")
          span.page-org-unit__contact-role Директор филиала
        .page-org-unit__contact-name {{ unit.director_full_name }}
        .page-org-unit__contact-links
          a.page-org-unit__contact-link(v-if="unit.director_phone", :href="`tel:${unit.director_phone}`")
            Phone(:size="13")
            | {{ unit.director_phone }}
          a.page-org-unit__contact-link(v-if="unit.director_email", :href="`mailto:${unit.director_email}`")
            Mail(:size="13")
            | {{ unit.director_email }}

      .page-org-unit__contact-card(v-if="unit.cluster_director_full_name")
        .page-org-unit__contact-header
          Building2(:size="16")
          span.page-org-unit__contact-role Директор кластера
        .page-org-unit__contact-name {{ unit.cluster_director_full_name }}
        .page-org-unit__contact-links(v-if="unit.cluster_director_email")
          a.page-org-unit__contact-link(:href="`mailto:${unit.cluster_director_email}`")
            Mail(:size="13")
            | {{ unit.cluster_director_email }}

    //- Attached Managers Bar
    .page-org-unit__managers-bar
      .page-org-unit__managers-info
        span.page-org-unit__managers-title Закрепленные менеджеры и HR ({{ unit.managers?.length || 0 }}):
        .page-org-unit__manager-chips(v-if="unit.managers && unit.managers.length > 0")
          .manager-chip(
            v-for="mgr in unit.managers",
            :key="mgr.id",
            :class="`manager-chip--${mgr.role || 'director'}`"
          )
            span.manager-chip__role {{ getManagerRoleLabel(mgr.role) }}
            span.manager-chip__name {{ mgr.full_name }}
            span.manager-chip__phone(v-if="mgr.phone") {{ mgr.phone }}
        span.page-org-unit__managers-empty(v-else) Специалисты ещё не закреплены
      
      UiButton(variant="secondary", size="sm", @click="showManagersModal = true")
        template(#icon)
          Users(:size="14")
        | Управление сотрудниками

  //- Vacancies in this Org Unit
  .page-org-unit__vacancies-section
    .page-org-unit__section-header
      .page-org-unit__section-headline
        h2.page-org-unit__section-title Вакансии в подразделении
        p.page-org-unit__section-subtitle Штатное расписание филиала: открытие, закрытие и мониторинг потока соискателей
      
      .page-org-unit__stats-pills
        .stat-pill
          span.stat-pill__label Открыто вакансий:
          strong.stat-pill__val {{ openVacanciesCount }} / {{ combinedVacancies.length }}
        .stat-pill
          span.stat-pill__label Всего кандидатов:
          strong.stat-pill__val {{ totalCandidatesCount }}

    .page-org-unit__vacancies-list(v-if="vacanciesStore.isLoading && !combinedVacancies.length", aria-hidden="true")
      .vacancy-item(v-for="i in 3", :key="i", style="pointer-events: none;")
        UiSkeleton(width="180px", height="20px")
        UiSkeleton(width="100%", height="40px")
        UiSkeleton(width="120px", height="32px")

    .page-org-unit__vacancies-list(v-else)
      .vacancy-item(
        v-for="item in combinedVacancies",
        :key="item.key",
        :class="{ 'vacancy-item--open': item.isOpen, 'vacancy-item--closed': !item.isOpen }"
      )
        .vacancy-item__main
          .vacancy-item__header-row
            NuxtLink.vacancy-item__title(
              v-if="item.dbVacancy",
              :to="`/vacancies/${item.dbVacancy.id}`"
              title="Перейти к воронке соискателей"
            ) {{ item.title }}
            span.vacancy-item__title-static(v-else) {{ item.title }}

            .vacancy-item__badge(:class="item.isOpen ? 'vacancy-item__badge--open' : 'vacancy-item__badge--closed'")
              | {{ item.isOpen ? 'Открыта' : 'Закрыта' }}

            span.vacancy-item__preset-tag(v-if="item.isDefaultPreset") Типовая должность

          p.vacancy-item__desc(v-if="item.description") {{ item.description }}

          //- Candidate counts if vacancy exists in database
          .vacancy-item__counters(v-if="item.dbVacancy?.status_counts")
            .vacancy-item__counter.vacancy-item__counter--total
              Users(:size="13")
              span Всего соискателей: 
              strong {{ item.dbVacancy.status_counts.total }}
            .vacancy-item__counter.vacancy-item__counter--new
              span.vacancy-item__counter-dot
              span Новые: 
              strong {{ item.dbVacancy.status_counts.new }}
            .vacancy-item__counter.vacancy-item__counter--interview
              span.vacancy-item__counter-dot
              span Интервью: 
              strong {{ item.dbVacancy.status_counts.interview }}
            .vacancy-item__counter.vacancy-item__counter--accepted
              span.vacancy-item__counter-dot
              span Приняты: 
              strong {{ item.dbVacancy.status_counts.accepted }}
          .vacancy-item__counters-empty(v-else)
            span.vacancy-item__hint Вакансия закрыта в данном филиале

        .vacancy-item__actions
          NuxtLink.vacancy-item__funnel-btn(
            v-if="item.dbVacancy",
            :to="`/vacancies/${item.dbVacancy.id}`"
          )
            | Воронка соискателей ▶

          UiButton(
            v-if="permissions.canToggleVacancyStatus.value",
            :variant="item.isOpen ? 'secondary' : 'primary'",
            size="sm",
            :disabled="item.isToggling",
            @click="handleToggleVacancy(item)"
          )
            template(#icon)
              component(:is="item.isOpen ? XCircle : CheckCircle2", :size="15")
            | {{ item.isOpen ? 'Закрыть вакансию' : 'Открыть вакансию' }}

  //- Modal: Manage Managers in this unit
  UiModal(
    v-model="showManagersModal",
    :title="`Менеджеры: ${unit.name}`",
    size="lg"
  )
    .unit-managers-modal
      .unit-managers-modal__current
        h4.unit-managers-modal__section-title Назначенные специалисты
        .unit-managers-modal__empty(v-if="!unit.managers || unit.managers.length === 0")
          p В данное подразделение еще не назначены HR или менеджеры.
        .unit-managers-modal__list(v-else)
          .unit-manager-item(v-for="mgr in unit.managers", :key="mgr.id")
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
            :options="managerRoleOptions",
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

.page-org-unit.page-org-unit--skeleton(v-else-if="orgUnitsStore.isLoading", aria-hidden="true")
  .page-org-unit__top
    UiSkeleton(width="180px", height="24px")
  .page-org-unit__header-card(style="display: flex; flex-direction: column; gap: 16px;")
    UiSkeleton(width="300px", height="32px")
    UiSkeleton(width="400px", height="18px")
    UiSkeleton(width="100%", height="120px")
  .page-org-unit__vacancies-section(style="margin-top: 24px;")
    UiSkeleton(width="240px", height="24px", style="margin-bottom: 16px;")
    UiSkeleton(width="100%", height="100px", style="margin-bottom: 12px;")
    UiSkeleton(width="100%", height="100px")
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, MapPin, UserCheck, Building2, Phone, Mail,
  Users, Plus, Trash2, CheckCircle2, XCircle,
} from 'lucide-vue-next'
import { useOrgUnitsStore } from '~/stores/org-units.store'
import { useVacanciesStore } from '~/stores/vacancies.store'
import { useRolePermissions } from '~/composables/useRolePermissions'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'
import UiSkeleton from '~/components/ui/UiSkeleton/UiSkeleton.vue'
import { VACANCY_PRESETS, findVacancyPresetById, type VacancyPreset } from '~/data/vacancy-presets'
import { getManagerRoleLabel } from '~/utils/manager-roles'
import type { ManagerRole } from '~/types/org-unit.types'
import type { Vacancy } from '~/types/vacancy.types'

interface UnitVacancyDisplayItem {
  key: string
  title: string
  description: string | null
  requirements: string | null
  responsibilities: string | null
  isOpen: boolean
  isDefaultPreset: boolean
  preset?: VacancyPreset
  dbVacancy?: Vacancy
  isToggling?: boolean
}

const route = useRoute()
const router = useRouter()
const orgUnitsStore = useOrgUnitsStore()
const vacanciesStore = useVacanciesStore()
const permissions = useRolePermissions()
const toast = useToast()
const confirm = useConfirm()

const unitId = computed(() => route.params.id as string)
const unit = computed(() => orgUnitsStore.currentUnit)

const showManagersModal = ref(false)
const togglingKeys = ref<Set<string>>(new Set())

const managerRoleOptions = [
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

onMounted(async () => {
  if (!unitId.value) return
  await Promise.all([
    orgUnitsStore.fetchById(unitId.value),
    vacanciesStore.fetchAll(),
  ])
  if (!unit.value) {
    toast.error('Подразделение не найдено')
    router.push('/org-units')
  }
})

// Normalizes titles to match presets with DB vacancies (e.g. "кассир" matches "продавец-кассир")
const normalizeTitle = (title: string): string => {
  return title.trim().toLowerCase().replace(/[-–—]/g, ' ')
}

// Combines the 6 default presets + existing DB vacancies for this unit
const combinedVacancies = computed<UnitVacancyDisplayItem[]>(() => {
  const currentUnitId = unitId.value
  const existingForUnit = vacanciesStore.vacancies.filter(v => v.org_unit_id === currentUnitId)
  const matchedExistingIds = new Set<string>()

  // 1. Map through the 6 default presets
  const presetItems: UnitVacancyDisplayItem[] = VACANCY_PRESETS.map(preset => {
    const normPresetTitle = normalizeTitle(preset.title)
    
    // Find matching vacancy in DB
    const matchingVacancy = existingForUnit.find(v => {
      const normV = normalizeTitle(v.title)
      return normV === normPresetTitle || 
        (preset.id === 'cashier' && normV.includes('кассир')) ||
        (preset.id === 'baker' && normV.includes('пекар')) ||
        (preset.id === 'picker' && normV.includes('сборщик'))
    })

    if (matchingVacancy) {
      matchedExistingIds.add(matchingVacancy.id)
      return {
        key: `preset-${preset.id}-${matchingVacancy.id}`,
        title: matchingVacancy.title,
        description: matchingVacancy.description || preset.description,
        requirements: matchingVacancy.requirements || preset.requirements,
        responsibilities: matchingVacancy.responsibilities || preset.responsibilities,
        isOpen: matchingVacancy.is_open,
        isDefaultPreset: true,
        preset,
        dbVacancy: matchingVacancy,
        isToggling: togglingKeys.value.has(matchingVacancy.id),
      }
    }

    return {
      key: `preset-${preset.id}`,
      title: preset.title,
      description: preset.description,
      requirements: preset.requirements,
      responsibilities: preset.responsibilities,
      isOpen: false,
      isDefaultPreset: true,
      preset,
      dbVacancy: undefined,
      isToggling: togglingKeys.value.has(`preset-${preset.id}`),
    }
  })

  // 2. Add other custom vacancies attached to this unit that didn't match default presets
  const customItems: UnitVacancyDisplayItem[] = existingForUnit
    .filter(v => !matchedExistingIds.has(v.id))
    .map(v => ({
      key: `custom-${v.id}`,
      title: v.title,
      description: v.description,
      requirements: v.requirements,
      responsibilities: v.responsibilities,
      isOpen: v.is_open,
      isDefaultPreset: false,
      dbVacancy: v,
      isToggling: togglingKeys.value.has(v.id),
    }))

  return [...presetItems, ...customItems]
})

const openVacanciesCount = computed(() => {
  return combinedVacancies.value.filter(item => item.isOpen).length
})

const totalCandidatesCount = computed(() => {
  return combinedVacancies.value.reduce((acc, item) => {
    return acc + (item.dbVacancy?.status_counts?.total || 0)
  }, 0)
})

// Quick Toggle / Open Vacancy in this Org Unit
const handleToggleVacancy = async (item: UnitVacancyDisplayItem) => {
  const toggleKey = item.dbVacancy ? item.dbVacancy.id : item.key
  togglingKeys.value.add(toggleKey)

  try {
    if (item.dbVacancy) {
      // Vacancy already exists in DB: toggle its is_open state
      const targetState = !item.dbVacancy.is_open
      const success = await vacanciesStore.toggleOpen(item.dbVacancy.id, targetState)
      if (success) {
        toast.success(targetState ? `Вакансия «${item.title}» открыта` : `Вакансия «${item.title}» закрыта`)
      } else {
        toast.error('Не удалось изменить статус вакансии')
      }
    } else if (item.preset) {
      // Vacancy is a default preset not yet in DB for this unit: create and open it
      const created = await vacanciesStore.create({
        title: item.preset.title,
        description: item.preset.description,
        requirements: item.preset.requirements,
        responsibilities: item.preset.responsibilities,
        org_unit_id: unitId.value,
        is_open: true,
      })
      if (created) {
        toast.success(`Вакансия «${item.preset.title}» успешно открыта в филиале`)
      } else {
        toast.error('Не удалось открыть вакансию')
      }
    }
  } catch (err: unknown) {
    toast.error('Ошибка при изменении статуса вакансии')
    console.error(err)
  } finally {
    togglingKeys.value.delete(toggleKey)
  }
}

// Manager Management
const handleAddManager = async () => {
  if (!unit.value || !isNewManagerValid.value) return
  try {
    await orgUnitsStore.addManager({
      org_unit_id: unit.value.id,
      full_name: newManager.full_name.trim(),
      email: newManager.email.trim(),
      phone: newManager.phone.trim(),
      role: newManager.role,
    })
    newManager.full_name = ''
    newManager.email = ''
    newManager.phone = ''
    toast.success('Сотрудник назначен в подразделение')
  } catch (err: unknown) {
    toast.error('Не удалось назначить сотрудника')
    console.error(err)
  }
}

const handleRemoveManager = async (managerId: string) => {
  if (!unit.value) return
  const confirmed = await confirm.confirm({
    title: 'Открепление сотрудника',
    message: 'Вы уверены, что хотите открепить этого сотрудника от подразделения?',
    confirmText: 'Открепить',
    cancelText: 'Отмена',
    variant: 'danger',
    icon: 'trash',
  })
  if (!confirmed) return

  try {
    await orgUnitsStore.removeManager(unit.value.id, managerId)
    toast.success('Сотрудник откреплен')
  } catch (err: unknown) {
    toast.error('Не удалось открепить сотрудника')
    console.error(err)
  }
}
</script>

<style lang="scss">
.page-org-unit {
  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-6);
  }

  &__back {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--color-text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: var(--color-primary);
    }
  }

  &__top-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__header-card {
    padding: 24px;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: var(--spacing-8);
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }

  &__category {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 3px 10px;
    border-radius: 9999px;
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
  }

  &__address {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    color: var(--color-text-secondary);
  }

  &__contacts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }

  &__contact-card {
    padding: 14px 16px;
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__contact-header {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-primary);
  }

  &__contact-role {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__contact-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__contact-links {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 4px;
  }

  &__contact-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    color: var(--color-text-secondary);
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: var(--color-primary);
      text-decoration: underline;
    }
  }

  &__managers-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-top: 16px;
    border-top: 1px dashed var(--color-border);
    flex-wrap: wrap;
  }

  &__managers-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__managers-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  &__manager-chips {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__managers-empty {
    font-size: 13px;
    color: var(--color-text-muted);
    font-style: italic;
  }

  &__vacancies-section {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  &__section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__section-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }

  &__section-subtitle {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 4px 0 0 0;
  }

  &__stats-pills {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__vacancies-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  font-size: 13px;

  &__label {
    color: var(--color-text-secondary);
  }

  &__val {
    color: var(--color-primary);
    font-weight: 700;
  }
}

.vacancy-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  padding: 20px 24px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;

  &--open {
    border-left: 4px solid #22c55e;
  }

  &--closed {
    border-left: 4px solid var(--color-border);
    opacity: 0.85;

    &:hover {
      opacity: 1;
    }
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }

  &__header-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__title {
    font-size: 17px;
    font-weight: 700;
    color: var(--color-text-primary);
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: var(--color-primary);
      text-decoration: underline;
    }
  }

  &__title-static {
    font-size: 17px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  &__badge {
    padding: 3px 10px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 600;

    &--open {
      background-color: rgba(34, 197, 94, 0.15);
      color: #22c55e;
    }

    &--closed {
      background-color: rgba(148, 163, 184, 0.15);
      color: var(--color-text-muted);
    }
  }

  &__preset-tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    background-color: var(--color-bg-secondary);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
  }

  &__desc {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  &__counters {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 4px;
  }

  &__counters-empty {
    font-size: 12px;
    color: var(--color-text-muted);
    font-style: italic;
    margin-top: 4px;
  }

  &__counter {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: var(--radius-full);
    font-size: 12px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);

    strong {
      color: var(--color-text-primary);
    }

    &-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    &--total {
      color: var(--color-primary);
      strong { color: var(--color-primary); }
    }

    &--new &-dot {
      background-color: #3b82f6;
    }

    &--interview &-dot {
      background-color: #f59e0b;
    }

    &--accepted &-dot {
      background-color: #10b981;
    }
  }

  &__actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    flex-shrink: 0;
  }

  &__funnel-btn {
    font-size: 12px;
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
}
</style>
