<template lang="pug">
.page-vacancies
  .page-vacancies__header
    h1.page-title Вакансии
    UiButton(variant="primary", @click="showCreateModal = true")
      template(#icon)
        Plus(:size="18")
      | Добавить вакансию
      
  .page-vacancies__search
    .candidate-search__input-wrapper
      Search.candidate-search__icon(:size="16")
      input.candidate-search__input(
        v-model="searchQuery",
        placeholder="Поиск по названию вакансии...",
        @input="debouncedSearch"
      )
      
  .page-vacancies__loading(v-if="vacanciesStore.isLoading")
    .page-candidates__spinner
    | Загрузка...
    
  .page-vacancies__empty(v-else-if="vacanciesStore.vacancies.length === 0")
    Briefcase(:size="48")
    p Вакансии не найдены
    
  .page-vacancies__list(v-else)
    .vacancy-card(v-for="v in vacanciesStore.vacancies", :key="v.id")
      .vacancy-card__left
        NuxtLink.vacancy-card__title(:to="`/vacancies/${v.id}`") {{ v.title }}
        p.vacancy-card__desc(v-if="v.description") {{ v.description }}
      .vacancy-card__right
        .vacancy-card__badge(:class="v.is_open ? 'vacancy-card__badge--open' : 'vacancy-card__badge--closed'")
          | {{ v.is_open ? 'Открыта' : 'Закрыта' }}
        UiButton(
          :variant="v.is_open ? 'secondary' : 'primary'",
          size="sm",
          @click="toggleVacancy(v)"
        ) {{ v.is_open ? 'Закрыть' : 'Открыть' }}

  //- Create vacancy modal
  UiModal(v-model="showCreateModal", title="Создать вакансию", size="md")
    .vacancy-form
      UiInput(v-model="newVacancy.title", label="Название *", placeholder="Кассир")
      UiInput(v-model="newVacancy.description", label="Описание", placeholder="Описание вакансии")
      UiInput(v-model="newVacancy.requirements", label="Требования", placeholder="Опыт работы от 1 года")
      UiInput(v-model="newVacancy.responsibilities", label="Обязанности", placeholder="Обслуживание клиентов")
      UiSelect(
        v-model="newVacancy.org_unit_id",
        label="Орг. единица",
        :options="orgUnitOptions",
        placeholder="Выберите",
        searchable
      )
    template(#footer)
      UiButton(variant="secondary", @click="showCreateModal = false") Отмена
      UiButton(variant="primary", @click="createVacancy", :disabled="!newVacancy.title") Создать
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Search, Briefcase } from 'lucide-vue-next'
import { useVacanciesStore } from '~/stores/vacancies.store'
import { useOrgUnitsStore } from '~/stores/org-units.store'
import type { Vacancy } from '~/types/vacancy.types'

const vacanciesStore = useVacanciesStore()
const orgUnitsStore = useOrgUnitsStore()

const searchQuery = ref('')
const showCreateModal = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const newVacancy = reactive({
  title: '',
  description: '',
  requirements: '',
  responsibilities: '',
  org_unit_id: '',
})

const orgUnitOptions = computed(() => {
  return orgUnitsStore.orgUnits.map(u => ({ value: u.id, label: u.name }))
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
  await vacanciesStore.toggleOpen(v.id, !v.is_open)
}

const createVacancy = async () => {
  if (!newVacancy.title.trim()) return
  await vacanciesStore.create({
    title: newVacancy.title,
    description: newVacancy.description || null,
    requirements: newVacancy.requirements || null,
    responsibilities: newVacancy.responsibilities || null,
    org_unit_id: newVacancy.org_unit_id || null,
    is_open: true,
  })
  showCreateModal.value = false
  newVacancy.title = ''
  newVacancy.description = ''
  newVacancy.requirements = ''
  newVacancy.responsibilities = ''
  newVacancy.org_unit_id = ''
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
  
  &__search { margin-bottom: var(--spacing-4); }
  &__loading, &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 0;
    color: var(--color-text-secondary);
  }
  
  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.vacancy-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.2s;
  
  &:hover { border-color: var(--color-primary); }
  
  &__left { flex: 1; }
  
  &__title {
    font-weight: 600;
    font-size: 16px;
    color: var(--color-primary);
    
    &:hover { text-decoration: underline; }
  }
  
  &__desc {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin-top: 4px;
  }
  
  &__right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  &__badge {
    padding: 4px 12px;
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 600;
    
    &--open { background-color: rgba(34, 197, 94, 0.1); color: #22c55e; }
    &--closed { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
  }
}

.vacancy-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
