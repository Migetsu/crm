<template lang="pug">
.page-vacancy(v-if="vacancy")
  .page-candidate__top
    button.page-candidate__back(@click="$router.push('/vacancies')")
      ArrowLeft(:size="18")
      | Назад к вакансиям
      
  .page-vacancy__header
    h1.page-title {{ vacancy.title }}
    .page-vacancy__actions
      .vacancy-card__badge(:class="vacancy.is_open ? 'vacancy-card__badge--open' : 'vacancy-card__badge--closed'")
        | {{ vacancy.is_open ? 'Открыта' : 'Закрыта' }}
      UiButton(
        :variant="vacancy.is_open ? 'secondary' : 'primary'",
        size="sm",
        @click="toggle"
      ) {{ vacancy.is_open ? 'Закрыть' : 'Открыть' }}
  
  .page-vacancy__sections
    .page-vacancy__section(v-if="vacancy.description")
      h3 Описание
      p {{ vacancy.description }}
    .page-vacancy__section(v-if="vacancy.requirements")
      h3 Требования
      p {{ vacancy.requirements }}
    .page-vacancy__section(v-if="vacancy.responsibilities")
      h3 Обязанности
      p {{ vacancy.responsibilities }}
      
  .page-vacancy__candidates
    h3 Кандидаты на эту вакансию
    .page-vacancies__loading(v-if="isLoadingCandidates")
      .page-candidates__spinner
    .page-vacancies__empty(v-else-if="candidates.length === 0")
      p Кандидатов пока нет
    .page-candidates__list(v-else)
      CandidateCard(
        v-for="c in candidates",
        :key="c.id",
        :candidate="c"
      )
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { useVacanciesStore } from '~/stores/vacancies.store'
import { CandidatesService } from '~/services/candidates.service'
import type { Candidate } from '~/types/candidate.types'

const route = useRoute()
const vacanciesStore = useVacanciesStore()
const supabase = useSupabaseClient()
const candidatesService = new CandidatesService(supabase)

const vacancy = computed(() => vacanciesStore.currentVacancy)
const candidates = ref<Candidate[]>([])
const isLoadingCandidates = ref(false)

onMounted(async () => {
  const id = route.params.id as string
  await vacanciesStore.fetchById(id)
  
  isLoadingCandidates.value = true
  try {
    const { data } = await supabase
      .from('candidates')
      .select('*')
      .eq('vacancy_id', id)
      .order('created_at', { ascending: false })
    candidates.value = data || []
  } finally {
    isLoadingCandidates.value = false
  }
})

const toggle = async () => {
  if (!vacancy.value) return
  await vacanciesStore.toggleOpen(vacancy.value.id, !vacancy.value.is_open)
}
</script>

<style lang="scss">
.page-vacancy {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-6);
  }
  
  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  &__sections {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: var(--spacing-8);
  }
  
  &__section {
    padding: 20px;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    
    h3 {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-secondary);
      margin-bottom: 8px;
    }
    
    p {
      font-size: 14px;
      color: var(--color-text-primary);
      line-height: 1.6;
    }
  }
  
  &__candidates {
    h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
    }
  }
}
</style>
