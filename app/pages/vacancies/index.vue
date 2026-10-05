<template lang="pug">
.page-vacancies
  .page-vacancies__header
    .page-vacancies__headline
      h1.page-title Вакансии
      p.page-vacancies__subtitle Управление штатным расписанием, филиалами и потоком соискателей
    UiButton(variant="primary", @click="showCreateModal = true")
      template(#icon)
        Plus(:size="18")
      | Добавить вакансию
      
  .page-vacancies__filters-bar
    .page-vacancies__search
      Search.page-vacancies__search-icon(:size="16")
      input.page-vacancies__search-input(
        v-model="searchQuery",
        placeholder="Поиск по названию вакансии...",
        @input="debouncedSearch"
      )
    .page-vacancies__filter-select
      UiSelect(
        v-model="selectedOrgUnitFilter",
        :options="orgUnitFilterOptions",
        placeholder="Все подразделения",
        searchable
      )
    .page-vacancies__filter-select
      UiSelect(
        v-model="selectedStatusFilter",
        :options="statusFilterOptions",
        placeholder="Все статусы"
      )
      
  .page-vacancies__list(v-if="vacanciesStore.isLoading", aria-hidden="true")
    .vacancy-card(v-for="i in 3", :key="i", style="pointer-events: none;")
      .vacancy-card__left(style="width: 100%;")
        .vacancy-card__title-row(style="display: flex; gap: 12px; margin-bottom: 8px;")
          UiSkeleton(width="220px", height="20px")
          UiSkeleton(width="80px", height="20px")
        .vacancy-card__org-unit(style="display: flex; gap: 8px; margin-bottom: 12px;")
          UiSkeleton(width="140px", height="14px")
          UiSkeleton(width="180px", height="14px")
        UiSkeleton(width="90%", height="14px", style="margin-bottom: 12px;")
        .vacancy-card__counters(style="display: flex; gap: 12px;")
          UiSkeleton(width="70px", height="24px")
          UiSkeleton(width="60px", height="24px")
          UiSkeleton(width="60px", height="24px")
    
  .page-vacancies__empty(v-else-if="filteredVacancies.length === 0")
    Briefcase(:size="48")
    p Вакансии не найдены
    p.page-vacancies__empty-hint Попробуйте изменить параметры поиска или фильтра
    
  .page-vacancies__list(v-else)
    .vacancy-card(v-for="v in filteredVacancies", :key="v.id")
      .vacancy-card__left
        .vacancy-card__title-row
          NuxtLink.vacancy-card__title(:to="`/vacancies/${v.id}`") {{ v.title }}
          .vacancy-card__badge(:class="v.is_open ? 'vacancy-card__badge--open' : 'vacancy-card__badge--closed'")
            | {{ v.is_open ? 'Открыта' : 'Закрыта' }}

        .vacancy-card__org-unit(v-if="v.org_unit_name")
          Building2(:size="15")
          span.vacancy-card__org-name {{ v.org_unit_name }}
          span.vacancy-card__org-dot ·
          MapPin(:size="14")
          span.vacancy-card__org-address {{ v.org_unit_address || 'Адрес не указан' }}
        .vacancy-card__org-unit.vacancy-card__org-unit--unassigned(v-else)
          Building2(:size="15")
          span Филиал не прикреплен

        p.vacancy-card__desc(v-if="v.description") {{ v.description }}

        //- Candidate Status Counters
        .vacancy-card__counters(v-if="v.status_counts")
          .vacancy-card__counter.vacancy-card__counter--total
            Users(:size="14")
            span Всего: 
            strong {{ v.status_counts.total }}
          .vacancy-card__counter.vacancy-card__counter--new
            span.vacancy-card__counter-dot
            span Новые: 
            strong {{ v.status_counts.new }}
          .vacancy-card__counter.vacancy-card__counter--interview
            span.vacancy-card__counter-dot
            span На интервью: 
            strong {{ v.status_counts.interview }}
          .vacancy-card__counter.vacancy-card__counter--accepted
            span.vacancy-card__counter-dot
            span Приняты: 
            strong {{ v.status_counts.accepted }}
          .vacancy-card__counter.vacancy-card__counter--reserve(v-if="v.status_counts.reserve > 0")
            span.vacancy-card__counter-dot
            span Резерв: 
            strong {{ v.status_counts.reserve }}

      .vacancy-card__right
        NuxtLink.vacancy-card__funnel-btn(:to="`/vacancies/${v.id}`")
          | Воронка вакансии ▶
        UiButton(
          :variant="v.is_open ? 'secondary' : 'primary'",
          size="sm",
          @click="toggleVacancy(v)"
        ) {{ v.is_open ? 'Закрыть' : 'Открыть' }}

  //- Create vacancy modal
  UiModal(v-model="showCreateModal", title="Создать вакансию", size="md")
    .vacancy-form
      UiInput(v-model="newVacancy.title", label="Название вакансии *", placeholder="Например, Кассир-продавец")
      UiSelect(
        v-model="newVacancy.org_unit_id",
        label="Филиал / Подразделение *",
        :options="orgUnitSelectOptions",
        placeholder="Выберите филиал",
        searchable
      )
      UiInput(v-model="newVacancy.description", label="Краткое описание", placeholder="О проекте, задачах...")
      UiInput(v-model="newVacancy.requirements", label="Требования к соискателю", placeholder="Опыт, навыки, образование...")
      UiInput(v-model="newVacancy.responsibilities", label="Обязанности", placeholder="Что предстоит делать...")
    template(#footer)
      UiButton(variant="secondary", @click="showCreateModal = false") Отмена
      UiButton(variant="primary", @click="createVacancy", :disabled="!newVacancy.title.trim() || isSubmitting")
        | {{ isSubmitting ? 'Создание...' : 'Создать вакансию' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Search, Briefcase, Building2, MapPin, Users } from 'lucide-vue-next'
import { useVacanciesStore } from '~/stores/vacancies.store'
import { useOrgUnitsStore } from '~/stores/org-units.store'
import { useToast } from '~/composables/useToast'
import UiSkeleton from '~/components/ui/UiSkeleton/UiSkeleton.vue'
import type { Vacancy } from '~/types/vacancy.types'

const vacanciesStore = useVacanciesStore()
const orgUnitsStore = useOrgUnitsStore()
const toast = useToast()

const searchQuery = ref('')
const selectedOrgUnitFilter = ref('')
const selectedStatusFilter = ref('all')
const showCreateModal = ref(false)
const isSubmitting = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const newVacancy = reactive({
  title: '',
  description: '',
  requirements: '',
  responsibilities: '',
  org_unit_id: '',
})

const orgUnitFilterOptions = computed(() => {
  return [
    { value: '', label: 'Все подразделения' },
    ...orgUnitsStore.orgUnits.map(u => ({ value: u.id, label: u.name })),
  ]
})

const orgUnitSelectOptions = computed(() => {
  return orgUnitsStore.orgUnits.map(u => ({ value: u.id, label: u.name }))
})

const statusFilterOptions = [
  { value: 'all', label: 'Все вакансии' },
  { value: 'open', label: 'Только открытые' },
  { value: 'closed', label: 'Только закрытые' },
]

const filteredVacancies = computed(() => {
  return vacanciesStore.vacancies.filter(v => {
    if (selectedOrgUnitFilter.value && v.org_unit_id !== selectedOrgUnitFilter.value) {
      return false
    }
    if (selectedStatusFilter.value === 'open' && !v.is_open) return false
    if (selectedStatusFilter.value === 'closed' && v.is_open) return false
    return true
  })
})

onMounted(async () => {
  await Promise.all([vacanciesStore.fetchAll(), orgUnitsStore.fetchAll()])
})

const debouncedSearch = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    vacanciesStore.search(searchQuery.value)
  }, 300)
}

const toggleVacancy = async (v: Vacancy) => {
  const success = await vacanciesStore.toggleOpen(v.id, !v.is_open)
  if (success) {
    toast.success(v.is_open ? 'Вакансия закрыта' : 'Вакансия открыта')
  } else {
    toast.error('Не удалось изменить статус вакансии')
  }
}

const createVacancy = async () => {
  if (!newVacancy.title.trim()) return
  isSubmitting.value = true
  try {
    const res = await vacanciesStore.create({
      title: newVacancy.title.trim(),
      description: newVacancy.description.trim() || null,
      requirements: newVacancy.requirements.trim() || null,
      responsibilities: newVacancy.responsibilities.trim() || null,
      org_unit_id: newVacancy.org_unit_id || null,
      is_open: true,
    })
    if (res) {
      toast.success('Вакансия успешно создана')
      showCreateModal.value = false
      newVacancy.title = ''
      newVacancy.description = ''
      newVacancy.requirements = ''
      newVacancy.responsibilities = ''
      newVacancy.org_unit_id = ''
    } else {
      toast.error('Не удалось создать вакансию')
    }
  } catch (err: unknown) {
    toast.error('Ошибка при создании вакансии')
    console.error(err)
  } finally {
    isSubmitting.value = false
  }
}
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
    grid-template-columns: 2fr 1fr 1fr;
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
  
  &:hover {
    border-color: var(--color-primary);
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
  }
  
  &__title {
    font-weight: 700;
    font-size: 18px;
    color: var(--color-text-primary);
    text-decoration: none;
    transition: color 0.2s;
    
    &:hover {
      color: var(--color-primary);
      text-decoration: underline;
    }
  }

  &__org-unit {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--color-text-secondary);

    &--unassigned {
      opacity: 0.6;
      font-style: italic;
    }
  }

  &__org-name {
    color: var(--color-text-primary);
    font-weight: 500;
  }

  &__org-dot {
    margin: 0 2px;
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

    &-dot {
      width: 7px;
      height: 7px;
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

    &--reserve &-dot {
      background-color: #8b5cf6;
    }
  }
  
  &__right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
    flex-shrink: 0;
  }

  &__funnel-btn {
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

.vacancy-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
