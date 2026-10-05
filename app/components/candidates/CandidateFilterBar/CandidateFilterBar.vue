<template lang="pug">
.candidate-filter-bar
  .candidate-filter-bar__top
    .candidate-filter-bar__search
      Search.candidate-filter-bar__search-icon(:size="16")
      input.candidate-filter-bar__search-input(
        v-model="localSearchQuery",
        placeholder="Быстрый поиск по ФИО или номеру телефона...",
        @input="handleSearchInput"
      )
      button.candidate-filter-bar__search-clear(
        v-if="localSearchQuery",
        type="button",
        @click="clearSearch"
      )
        X(:size="14")

    .candidate-filter-bar__actions
      button.candidate-filter-bar__reset(
        v-if="hasActiveFilters",
        type="button",
        @click="handleReset"
      )
        RotateCcw(:size="14")
        | Сбросить

      .candidate-filter-bar__view-toggle
        button.candidate-filter-bar__toggle-btn(
          type="button",
          :class="{ 'candidate-filter-bar__toggle-btn--active': candidatesStore.viewMode === 'list' }",
          title="Список",
          @click="candidatesStore.setViewMode('list')"
        )
          LayoutList(:size="16")
          span.candidate-filter-bar__toggle-text Список
        button.candidate-filter-bar__toggle-btn(
          type="button",
          :class="{ 'candidate-filter-bar__toggle-btn--active': candidatesStore.viewMode === 'grid' }",
          title="Сетка карточек",
          @click="candidatesStore.setViewMode('grid')"
        )
          LayoutGrid(:size="16")
          span.candidate-filter-bar__toggle-text Сетка
        button.candidate-filter-bar__toggle-btn(
          type="button",
          :class="{ 'candidate-filter-bar__toggle-btn--active': candidatesStore.viewMode === 'kanban' }",
          title="Канбан-доска",
          @click="candidatesStore.setViewMode('kanban')"
        )
          Kanban(:size="16")
          span.candidate-filter-bar__toggle-text Канбан

  .candidate-filter-bar__filters
    .candidate-filter-bar__select-item
      UiSelect(
        :model-value="candidatesStore.filters.vacancyId || ''",
        :options="vacancyOptions",
        placeholder="Все вакансии",
        searchable,
        @update:model-value="handleVacancyChange"
      )

    .candidate-filter-bar__select-item
      UiSelect(
        :model-value="candidatesStore.filters.status || 'all'",
        :options="statusOptions",
        placeholder="Все статусы",
        @update:model-value="handleStatusChange"
      )

    .candidate-filter-bar__select-item
      UiSelect(
        :model-value="candidatesStore.filters.source || 'all'",
        :options="sourceOptions",
        placeholder="Все источники",
        @update:model-value="handleSourceChange"
      )

    .candidate-filter-bar__select-item
      UiSelect(
        :model-value="candidatesStore.filters.datePeriod || 'all'",
        :options="periodOptions",
        placeholder="Период",
        @update:model-value="handlePeriodChange"
      )

    .candidate-filter-bar__select-item.candidate-filter-bar__select-item--sort
      UiSelect(
        :model-value="candidatesStore.filters.sortBy || 'created_at_desc'",
        :options="sortOptions",
        placeholder="Сортировка",
        @update:model-value="handleSortChange"
      )
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, X, RotateCcw, LayoutList, LayoutGrid, Kanban } from 'lucide-vue-next'
import { useCandidatesStore } from '~/stores/candidates.store'
import { useVacanciesStore } from '~/stores/vacancies.store'
import { STATUS_LABELS, SOURCE_LABELS } from '~/types/candidate.types'
import type { CandidateStatus, CandidateSource, CandidateSortOption, CandidateFilterParams } from '~/types/candidate.types'

const candidatesStore = useCandidatesStore()
const vacanciesStore = useVacanciesStore()

const localSearchQuery = ref(candidatesStore.filters.searchQuery || '')
let searchTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  if (vacanciesStore.vacancies.length === 0) {
    await vacanciesStore.fetchAll()
  }
})

const handleSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    candidatesStore.search(localSearchQuery.value)
  }, 300)
}

const clearSearch = () => {
  localSearchQuery.value = ''
  candidatesStore.search('')
}

const vacancyOptions = computed(() => {
  const options = [{ value: '', label: 'Все вакансии' }]
  for (const v of vacanciesStore.vacancies) {
    options.push({ value: v.id, label: v.title })
  }
  return options
})

const statusOptions = computed(() => {
  const options = [{ value: 'all', label: 'Все статусы' }]
  for (const [val, label] of Object.entries(STATUS_LABELS)) {
    options.push({ value: val, label })
  }
  return options
})

const sourceOptions = computed(() => {
  const options = [{ value: 'all', label: 'Все источники' }]
  for (const [val, label] of Object.entries(SOURCE_LABELS)) {
    options.push({ value: val, label })
  }
  return options
})

const periodOptions = [
  { value: 'all', label: 'За всё время' },
  { value: 'today', label: 'За сегодня' },
  { value: 'week', label: 'За 7 дней' },
  { value: 'month', label: 'За 30 дней' },
]

const sortOptions = [
  { value: 'created_at_desc', label: 'Сначала новые' },
  { value: 'created_at_asc', label: 'Сначала старые' },
  { value: 'name_asc', label: 'По имени (А-Я)' },
  { value: 'name_desc', label: 'По имени (Я-А)' },
  { value: 'status_asc', label: 'По статусу' },
]

const hasActiveFilters = computed(() => {
  const f = candidatesStore.filters
  return Boolean(
    localSearchQuery.value ||
    f.vacancyId ||
    (f.status && f.status !== 'all') ||
    (f.source && f.source !== 'all') ||
    (f.datePeriod && f.datePeriod !== 'all') ||
    (f.sortBy && f.sortBy !== 'created_at_desc')
  )
})

const handleVacancyChange = (val: string) => {
  candidatesStore.setFilter('vacancyId', val ? val : null)
}

const handleStatusChange = (val: string) => {
  candidatesStore.setFilter('status', val as CandidateStatus | 'all')
}

const handleSourceChange = (val: string) => {
  candidatesStore.setFilter('source', val as CandidateSource | 'all')
}

const handlePeriodChange = (val: string) => {
  candidatesStore.setFilter('datePeriod', val as CandidateFilterParams['datePeriod'])
}

const handleSortChange = (val: string) => {
  candidatesStore.setFilter('sortBy', val as CandidateSortOption)
}

const handleReset = async () => {
  localSearchQuery.value = ''
  await candidatesStore.resetFilters()
}
</script>

<style lang="scss">
.candidate-filter-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: var(--spacing-6);
  padding: 16px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__search {
    flex: 1;
    min-width: 260px;
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
    padding: 10px 36px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 14px;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }

  &__search-clear {
    position: absolute;
    right: 10px;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 4px;

    &:hover {
      color: var(--color-text-primary);
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__reset {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    font-size: 13px;
    color: var(--color-text-secondary);
    background: transparent;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: var(--color-danger, #ef4444);
      border-color: var(--color-danger, #ef4444);
    }
  }

  &__view-toggle {
    display: flex;
    background-color: var(--color-bg-body);
    padding: 3px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    gap: 2px;
  }

  &__toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 500;
    border-radius: calc(var(--radius-md) - 2px);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: var(--color-text-primary);
    }

    &--active {
      background-color: var(--color-primary);
      color: #ffffff !important;
    }
  }

  &__toggle-text {
    @media (max-width: 640px) {
      display: none;
    }
  }

  &__filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    align-items: center;
  }

  &__select-item {
    width: 100%;

    .ui-select {
      margin-bottom: 0;
    }
  }
}
</style>
