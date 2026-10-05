<template lang="pug">
.page-org-units
  .page-org-units__header
    h1.page-title Орг. единицы
    UiButton(variant="primary", @click="showCreateModal = true")
      template(#icon)
        Plus(:size="18")
      | Добавить орг. единицу
      
  .page-org-units__search
    .candidate-search__input-wrapper
      Search.candidate-search__icon(:size="16")
      input.candidate-search__input(
        v-model="searchQuery",
        placeholder="Поиск по названию или адресу...",
        @input="debouncedSearch"
      )
      
  .page-vacancies__loading(v-if="orgUnitsStore.isLoading")
    .page-candidates__spinner
    | Загрузка...
    
  .page-vacancies__empty(v-else-if="orgUnitsStore.orgUnits.length === 0")
    MapPin(:size="48")
    p Орг. единицы не найдены
    
  .page-org-units__list(v-else)
    .org-unit-card(v-for="unit in orgUnitsStore.orgUnits", :key="unit.id")
      .org-unit-card__header
        h3.org-unit-card__name {{ unit.name }}
        UiButton(variant="ghost", size="sm", @click="editUnit(unit)")
          Edit(:size="14")
      .org-unit-card__meta
        .org-unit-card__meta-item
          MapPin(:size="14")
          | {{ unit.interview_address }}
        .org-unit-card__meta-item
          User(:size="14")
          | Директор: {{ unit.director_full_name }}
        .org-unit-card__meta-item(v-if="unit.category")
          Tag(:size="14")
          | {{ unit.category }}

  //- Create modal (simplified)
  UiModal(v-model="showCreateModal", title="Добавить орг. единицу", size="lg")
    .vacancy-form
      UiInput(v-model="newUnit.name", label="Название *", placeholder="Пятёрочка №6702")
      UiInput(v-model="newUnit.category", label="Категория", placeholder="Ритейл")
      UiInput(v-model="newUnit.interview_address", label="Адрес собеседования *", placeholder="Москва, ул. Примерная, 1")
      UiInput(v-model="newUnit.director_full_name", label="ФИО директора *", placeholder="Петров Иван Сергеевич")
      UiInput(v-model="newUnit.director_email", label="Email директора *", placeholder="director@example.com")
      UiInput(v-model="newUnit.director_phone", label="Телефон директора *", placeholder="+7 900 000 00 00")
      UiInput(v-model="newUnit.cluster_director_full_name", label="ФИО директора кластера *", placeholder="Сидоров Алексей")
      UiInput(v-model="newUnit.cluster_director_email", label="Email директора кластера *", placeholder="cluster@example.com")
    template(#footer)
      UiButton(variant="secondary", @click="showCreateModal = false") Отмена
      UiButton(variant="primary", @click="createUnit") Создать
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search, MapPin, User, Tag, Edit } from 'lucide-vue-next'
import { useOrgUnitsStore } from '~/stores/org-units.store'
import type { OrgUnit } from '~/types/org-unit.types'

const orgUnitsStore = useOrgUnitsStore()
const searchQuery = ref('')
const showCreateModal = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

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

onMounted(async () => {
  await orgUnitsStore.fetchAll()
})

const debouncedSearch = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    orgUnitsStore.search(searchQuery.value)
  }, 300)
}

const editUnit = (unit: OrgUnit) => {
  // Will implement edit modal later
}

const createUnit = async () => {
  if (!newUnit.name.trim() || !newUnit.interview_address.trim()) return
  await orgUnitsStore.create({
    name: newUnit.name,
    category: newUnit.category || null,
    interview_address: newUnit.interview_address,
    director_full_name: newUnit.director_full_name,
    director_email: newUnit.director_email,
    director_phone: newUnit.director_phone,
    cluster_director_full_name: newUnit.cluster_director_full_name,
    cluster_director_email: newUnit.cluster_director_email,
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
    name: '', category: '', interview_address: '',
    director_full_name: '', director_email: '', director_phone: '',
    cluster_director_full_name: '', cluster_director_email: '',
  })
}
</script>

<style lang="scss">
.page-org-units {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-6);
  }
  
  &__search { margin-bottom: var(--spacing-4); }
  
  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.org-unit-card {
  padding: 16px 20px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color 0.2s;
  
  &:hover { border-color: var(--color-primary); }
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  &__name {
    font-size: 16px;
    font-weight: 600;
  }
  
  &__meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    
    &-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--color-text-secondary);
    }
  }
}
</style>
