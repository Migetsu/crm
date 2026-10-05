<template lang="pug">
.page-vacancies
  .page-vacancies__header
    .page-vacancies__headline
      h1.page-title Вакансии
      p.page-vacancies__subtitle Управление штатным расписанием сети и статусами должностей по филиалам
      
  .page-vacancies__filters-bar
    .page-vacancies__search
      Search.page-vacancies__search-icon(:size="16")
      input.page-vacancies__search-input(
        v-model="searchQuery",
        placeholder="Поиск по названию должности...",
      )
    .page-vacancies__filter-select
      UiSelect(
        v-model="selectedAvailabilityFilter",
        :options="availabilityFilterOptions",
        placeholder="Все должности"
      )
      
  .page-vacancies__list(v-if="vacanciesStore.isLoading && !vacanciesStore.isLoaded", aria-hidden="true")
    .vacancy-card(v-for="i in 3", :key="i", style="pointer-events: none;")
      .vacancy-card__left(style="width: 100%;")
        UiSkeleton(width="220px", height="24px", style="margin-bottom: 8px;")
        UiSkeleton(width="90%", height="16px", style="margin-bottom: 12px;")
        UiSkeleton(width="240px", height="24px")
    
  .page-vacancies__empty(v-else-if="filteredPositionCards.length === 0")
    Briefcase(:size="48")
    p Должности не найдены
    p.page-vacancies__empty-hint Попробуйте изменить параметры поиска или фильтра
    
  .page-vacancies__list(v-else)
    .vacancy-card.vacancy-card--interactive(
      v-for="item in filteredPositionCards",
      :key="item.preset.id",
      @click="openUnitModal(item.preset)"
    )
      .vacancy-card__left
        .vacancy-card__title-row
          h2.vacancy-card__title {{ item.preset.title }}
          .vacancy-card__badge(
            :class="item.openUnitsCount > 0 ? 'vacancy-card__badge--open' : 'vacancy-card__badge--closed'"
          )
            | {{ item.openUnitsCount > 0 ? `Открыта в филиалах: ${item.openUnitsCount} из ${item.totalUnitsCount}` : 'Закрыта во всех филиалах' }}

        p.vacancy-card__desc(v-if="item.preset.description") {{ item.preset.description }}

        .vacancy-card__counters
          .vacancy-card__counter.vacancy-card__counter--branches
            Building2(:size="14")
            span Филиалы: 
            strong {{ item.openUnitsCount }} / {{ item.totalUnitsCount }} открыто
          .vacancy-card__counter.vacancy-card__counter--total
            Users(:size="14")
            span Соискатели в сети: 
            strong {{ item.totalCandidatesCount }}

      .vacancy-card__right
        UiButton(
          variant="secondary",
          size="sm",
          @click.stop="openUnitModal(item.preset)"
        )
          | Филиалы и статусы ▶

  //- Modal: Branches & Statuses for the selected vacancy position
  UiModal(
    v-model="showUnitsModal",
    :title="selectedPreset ? `Филиалы: ${selectedPreset.title}` : 'Филиалы'",
    size="lg"
  )
    .vacancies-units-modal(v-if="selectedPreset")
      .vacancies-units-modal__header-summary
        p.vacancies-units-modal__desc {{ selectedPreset.description }}
        .vacancies-units-modal__stats
          span.vacancies-units-modal__stats-item
            | Открыто в филиалах: 
            strong {{ selectedPresetOpenCount }} из {{ orgUnitsStore.orgUnits.length }}
          .vacancies-units-modal__bulk-actions(v-if="permissions.canToggleVacancyStatus")
            UiButton(
              variant="secondary",
              size="xs",
              :disabled="selectedPresetOpenCount === orgUnitsStore.orgUnits.length || isBulkOperating",
              @click="handleBulkToggle(true)"
            ) Открыть во всех
            UiButton(
              variant="secondary",
              size="xs",
              :disabled="selectedPresetOpenCount === 0 || isBulkOperating",
              @click="handleBulkToggle(false)"
            ) Закрыть во всех

      .vacancies-units-modal__toolbar
        .vacancies-units-modal__search
          Search.vacancies-units-modal__search-icon(:size="16")
          input.vacancies-units-modal__search-input(
            v-model="unitSearchQuery",
            placeholder="Поиск по названию филиала или адресу...",
          )
        .vacancies-units-modal__tabs
          button.vacancies-units-modal__tab(
            type="button",
            :class="{ 'vacancies-units-modal__tab--active': unitFilterTab === 'all' }",
            @click="unitFilterTab = 'all'"
          )
            | Все ({{ orgUnitsStore.orgUnits.length }})
          button.vacancies-units-modal__tab(
            type="button",
            :class="{ 'vacancies-units-modal__tab--active': unitFilterTab === 'open' }",
            @click="unitFilterTab = 'open'"
          )
            | Открыта ({{ selectedPresetOpenCount }})
          button.vacancies-units-modal__tab(
            type="button",
            :class="{ 'vacancies-units-modal__tab--active': unitFilterTab === 'closed' }",
            @click="unitFilterTab = 'closed'"
          )
            | Закрыта ({{ orgUnitsStore.orgUnits.length - selectedPresetOpenCount }})

      .vacancies-units-modal__list(v-if="filteredModalUnits.length === 0")
        .vacancies-units-modal__empty
          Building2(:size="36")
          p Филиалы не найдены
          span.vacancies-units-modal__empty-hint Попробуйте изменить параметры поиска или фильтра

      .vacancies-units-modal__list(v-else)
        .vacancies-units-modal__item(
          v-for="unitItem in filteredModalUnits",
          :key="unitItem.unit.id",
          :class="{ 'vacancies-units-modal__item--open': unitItem.isOpen }"
        )
          .vacancies-units-modal__item-info
            .vacancies-units-modal__item-name-row
              NuxtLink.vacancies-units-modal__item-name(
                :to="`/org-units/${unitItem.unit.id}`",
                title="Перейти к странице подразделения"
              ) {{ unitItem.unit.name }}
              span.vacancies-units-modal__badge(
                :class="unitItem.isOpen ? 'vacancies-units-modal__badge--open' : 'vacancies-units-modal__badge--closed'"
              )
                | {{ unitItem.isOpen ? 'Открыта' : 'Закрыта' }}

            .vacancies-units-modal__item-address
              MapPin(:size="14")
              span {{ unitItem.unit.interview_address || 'Адрес не указан' }}

            .vacancies-units-modal__item-funnel(v-if="unitItem.dbVacancy")
              NuxtLink.vacancies-units-modal__funnel-link(
                :to="`/vacancies/${unitItem.dbVacancy.id}`"
              )
                | Воронка соискателей ({{ unitItem.dbVacancy.status_counts?.total || 0 }}) ▶

          .vacancies-units-modal__item-actions(v-if="permissions.canToggleVacancyStatus.value")
            UiButton(
              :variant="unitItem.isOpen ? 'secondary' : 'primary'",
              size="sm",
              :disabled="togglingUnitIds.has(unitItem.unit.id)",
              @click="handleToggleUnit(unitItem)"
            )
              template(#icon)
                component(:is="unitItem.isOpen ? XCircle : CheckCircle2", :size="15")
              | {{ unitItem.isOpen ? 'Закрыть вакансию' : 'Открыть вакансию' }}

    template(#footer)
      UiButton(variant="secondary", @click="showUnitsModal = false") Закрыть
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Search,
  Briefcase,
  Building2,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-vue-next'
import { useVacanciesStore } from '~/stores/vacancies.store'
import { useOrgUnitsStore } from '~/stores/org-units.store'
import { useToast } from '~/composables/useToast'
import { useRolePermissions } from '~/composables/useRolePermissions'
import UiSkeleton from '~/components/ui/UiSkeleton/UiSkeleton.vue'
import { VACANCY_PRESETS, type VacancyPreset } from '~/data/vacancy-presets'
import { findVacancyForPreset } from '~/utils/vacancy-preset-match'
import type { OrgUnit } from '~/types/org-unit.types'
import type { Vacancy } from '~/types/vacancy.types'

const vacanciesStore = useVacanciesStore()
const orgUnitsStore = useOrgUnitsStore()
const toast = useToast()
const permissions = useRolePermissions()

const searchQuery = ref('')
const selectedAvailabilityFilter = ref('all')

const showUnitsModal = ref(false)
const selectedPreset = ref<VacancyPreset | null>(null)
const unitSearchQuery = ref('')
const unitFilterTab = ref<'all' | 'open' | 'closed'>('all')
const togglingUnitIds = ref<Set<string>>(new Set())

const availabilityFilterOptions = [
  { value: 'all', label: 'Все должности (6)' },
  { value: 'open', label: 'Есть открытые филиалы' },
  { value: 'closed', label: 'Закрыта во всех филиалах' },
]

interface PositionCardItem {
  preset: VacancyPreset
  openUnitsCount: number
  totalUnitsCount: number
  totalCandidatesCount: number
  hasOpenUnits: boolean
}

const positionCards = computed<PositionCardItem[]>(() => {
  return VACANCY_PRESETS.map(preset => {
    const allMatchingVacancies = vacanciesStore.vacancies.filter(v =>
      findVacancyForPreset(preset, [v]) !== undefined
    )
    const openMatchingVacancies = allMatchingVacancies.filter(v => v.is_open && v.org_unit_id)
    const openOrgUnitIds = new Set(openMatchingVacancies.map(v => v.org_unit_id as string))
    const totalCandidatesCount = allMatchingVacancies.reduce(
      (sum, v) => sum + (v.status_counts?.total || 0),
      0
    )

    return {
      preset,
      openUnitsCount: openOrgUnitIds.size,
      totalUnitsCount: orgUnitsStore.orgUnits.length,
      totalCandidatesCount,
      hasOpenUnits: openOrgUnitIds.size > 0,
    }
  })
})

const filteredPositionCards = computed(() => {
  return positionCards.value.filter(card => {
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const matchTitle = card.preset.title.toLowerCase().includes(q)
      const matchDesc = card.preset.description.toLowerCase().includes(q)
      if (!matchTitle && !matchDesc) return false
    }
    if (selectedAvailabilityFilter.value === 'open' && !card.hasOpenUnits) return false
    if (selectedAvailabilityFilter.value === 'closed' && card.hasOpenUnits) return false
    return true
  })
})

const openUnitModal = (preset: VacancyPreset) => {
  selectedPreset.value = preset
  unitSearchQuery.value = ''
  unitFilterTab.value = 'all'
  showUnitsModal.value = true
}

const selectedPresetOpenCount = computed(() => {
  if (!selectedPreset.value) return 0
  const p = selectedPreset.value
  return orgUnitsStore.orgUnits.filter(unit => {
    const vac = findVacancyForPreset(
      p,
      vacanciesStore.vacancies.filter(v => v.org_unit_id === unit.id)
    )
    return Boolean(vac?.is_open)
  }).length
})

interface ModalUnitDisplayItem {
  unit: OrgUnit
  isOpen: boolean
  dbVacancy?: Vacancy
}

const modalUnits = computed<ModalUnitDisplayItem[]>(() => {
  if (!selectedPreset.value) return []
  const p = selectedPreset.value
  return orgUnitsStore.orgUnits.map(unit => {
    const vac = findVacancyForPreset(
      p,
      vacanciesStore.vacancies.filter(v => v.org_unit_id === unit.id)
    )
    return {
      unit,
      isOpen: Boolean(vac?.is_open),
      dbVacancy: vac,
    }
  })
})

const filteredModalUnits = computed(() => {
  return modalUnits.value.filter(item => {
    if (unitSearchQuery.value.trim()) {
      const q = unitSearchQuery.value.toLowerCase().trim()
      const matchName = item.unit.name.toLowerCase().includes(q)
      const matchAddr = (item.unit.interview_address || '').toLowerCase().includes(q)
      if (!matchName && !matchAddr) return false
    }
    if (unitFilterTab.value === 'open' && !item.isOpen) return false
    if (unitFilterTab.value === 'closed' && item.isOpen) return false
    return true
  })
})

const handleToggleUnit = async (item: ModalUnitDisplayItem) => {
  if (!selectedPreset.value) return
  const preset = selectedPreset.value
  const unitId = item.unit.id
  togglingUnitIds.value.add(unitId)

  try {
    const newState = await vacanciesStore.toggleUnitPreset(preset, unitId)
    if (newState === null) {
      toast.error('Не удалось изменить статус вакансии в филиале')
    } else {
      toast.success(
        newState
          ? `Вакансия «${preset.title}» открыта в «${item.unit.name}»`
          : `Вакансия «${preset.title}» закрыта в «${item.unit.name}»`
      )
    }
  } catch (err: unknown) {
    toast.error('Ошибка при изменении статуса вакансии')
    console.error(err)
  } finally {
    togglingUnitIds.value.delete(unitId)
  }
}

const isBulkOperating = ref(false)

const handleBulkToggle = async (targetOpen: boolean) => {
  if (!selectedPreset.value || isBulkOperating.value) return
  const preset = selectedPreset.value
  const allUnitIds = orgUnitsStore.orgUnits.map(u => u.id)
  isBulkOperating.value = true

  try {
    const success = await vacanciesStore.setAllUnitsPreset(preset, allUnitIds, targetOpen)
    if (success) {
      toast.success(
        targetOpen
          ? `Должность «${preset.title}» открыта во всех филиалах`
          : `Должность «${preset.title}» закрыта во всех филиалах`
      )
    } else {
      toast.error('Некоторые филиалы не удалось обновить')
    }
  } catch (err: unknown) {
    toast.error('Ошибка при обновлении статусов по филиалам')
    console.error(err)
  } finally {
    isBulkOperating.value = false
  }
}

onMounted(async () => {
  await Promise.all([vacanciesStore.fetchAll(), orgUnitsStore.fetchAll()])
})
</script>

<style lang="scss">
.page-vacancies {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-6);
  }

  &__headline {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__subtitle {
    font-size: 14px;
    color: var(--color-text-secondary);
  }
  
  &__filters-bar {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 14px;
    margin-bottom: var(--spacing-6);
    background-color: var(--color-bg-card);
    padding: 14px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  &__search {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__search-icon {
    position: absolute;
    left: 12px;
    color: var(--color-text-secondary);
    pointer-events: none;
  }

  &__search-input {
    width: 100%;
    padding: 10px 14px 10px 36px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
      border-color: var(--color-primary);
    }
  }

  &__filter-select {
    width: 100%;
  }
  
  &__loading, &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 0;
    color: var(--color-text-secondary);
  }

  &__empty-hint {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  
  &__list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
}

.vacancy-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all 0.2s;
  gap: 20px;
  
  &--interactive {
    cursor: pointer;

    &:hover {
      border-color: var(--color-primary);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
      transform: translateY(-1px);
    }
  }
  
  &__left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  &__title {
    font-weight: 700;
    font-size: 18px;
    color: var(--color-text-primary);
    margin: 0;
  }
  
  &__desc {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  &__counters {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 4px;
  }

  &__counter {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    font-size: 12px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);

    strong {
      color: var(--color-text-primary);
    }

    &--branches {
      color: var(--color-primary);
      strong { color: var(--color-primary); }
    }

    &--total {
      color: var(--color-text-primary);
    }
  }
  
  &__right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
    flex-shrink: 0;
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
      background-color: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
  }
}

.vacancies-units-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__header-summary {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  &__desc {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.4;
    margin: 0;
  }

  &__stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 13px;
    color: var(--color-text-primary);
    font-weight: 500;

    strong {
      color: var(--color-primary);
    }
  }

  &__bulk-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__toolbar {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__search {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__search-icon {
    position: absolute;
    left: 12px;
    color: var(--color-text-secondary);
    pointer-events: none;
  }

  &__search-input {
    width: 100%;
    padding: 9px 12px 9px 34px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
      border-color: var(--color-primary);
    }
  }

  &__tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__tab {
    padding: 5px 12px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
    background-color: var(--color-bg-body);
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      color: var(--color-text-primary);
      border-color: var(--color-primary);
    }

    &--active {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
      color: white;

      &:hover {
        color: white;
      }
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 420px;
    overflow-y: auto;
    padding-right: 4px;
  }

  &__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    transition: border-color 0.2s;

    &:hover {
      border-color: var(--color-primary);
    }

    &--open {
      border-left: 3px solid #22c55e;
    }

    &-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      flex: 1;
    }

    &-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    &-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--color-text-primary);
      text-decoration: none;

      &:hover {
        color: var(--color-primary);
        text-decoration: underline;
      }
    }

    &-address {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: var(--color-text-secondary);
    }

    &-funnel {
      margin-top: 2px;
    }

    &-actions {
      flex-shrink: 0;
    }
  }

  &__badge {
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 600;

    &--open {
      background-color: rgba(34, 197, 94, 0.15);
      color: #22c55e;
    }

    &--closed {
      background-color: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
  }

  &__funnel-link {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 36px 0;
    color: var(--color-text-secondary);
    gap: 8px;

    &-hint {
      font-size: 12px;
    }
  }
}
</style>
