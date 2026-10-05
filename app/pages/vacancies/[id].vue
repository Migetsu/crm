<template lang="pug">
.page-vacancy(v-if="vacancy")
  .page-vacancy__top
    button.page-vacancy__back(@click="$router.push('/vacancies')")
      ArrowLeft(:size="18")
      | Назад к вакансиям

  .page-vacancy__header
    .page-vacancy__headline
      .page-vacancy__title-row
        h1.page-title {{ vacancy.title }}
        .vacancy-card__badge(:class="vacancy.is_open ? 'vacancy-card__badge--open' : 'vacancy-card__badge--closed'")
          | {{ vacancy.is_open ? 'Открыта' : 'Закрыта' }}
      
      .page-vacancy__org-badge(v-if="vacancy.org_unit_name")
        Building2(:size="15")
        span {{ vacancy.org_unit_name }}
        span.page-vacancy__dot ·
        MapPin(:size="14")
        span {{ vacancy.org_unit_address || 'Адрес не указан' }}

    .page-vacancy__actions
      UiButton(variant="primary", size="sm", @click="showAddCandidateModal = true")
        template(#icon)
          Plus(:size="16")
        | Добавить кандидата
      UiButton(
        :variant="vacancy.is_open ? 'secondary' : 'primary'",
        size="sm",
        @click="toggle"
      ) {{ vacancy.is_open ? 'Закрыть вакансию' : 'Открыть вакансию' }}

  //- Details Grid: Info + Org Unit
  .page-vacancy__info-grid
    .page-vacancy__card
      h3.page-vacancy__card-title Описание вакансии
      .page-vacancy__text-block(v-if="vacancy.description")
        h4.page-vacancy__block-heading Описание
        p {{ vacancy.description }}
      .page-vacancy__text-block(v-if="vacancy.requirements")
        h4.page-vacancy__block-heading Требования
        p {{ vacancy.requirements }}
      .page-vacancy__text-block(v-if="vacancy.responsibilities")
        h4.page-vacancy__block-heading Обязанности
        p {{ vacancy.responsibilities }}
      p.page-vacancy__empty-desc(v-if="!vacancy.description && !vacancy.requirements && !vacancy.responsibilities")
        | Описание и требования не заполнены.

    .page-vacancy__card.page-vacancy__card--org(v-if="vacancy.org_unit_name")
      h3.page-vacancy__card-title Филиал / Подразделение
      .page-vacancy__org-detail
        .page-vacancy__org-item
          Building2(:size="16")
          .page-vacancy__org-text
            span.page-vacancy__org-label Название
            span.page-vacancy__org-val {{ vacancy.org_unit_name }}
        .page-vacancy__org-item(v-if="vacancy.org_unit_address")
          MapPin(:size="16")
          .page-vacancy__org-text
            span.page-vacancy__org-label Адрес проведения собеседований
            span.page-vacancy__org-val {{ vacancy.org_unit_address }}
        .page-vacancy__org-item(v-if="orgUnitDirector")
          UserCheck(:size="16")
          .page-vacancy__org-text
            span.page-vacancy__org-label Директор филиала
            span.page-vacancy__org-val {{ orgUnitDirector }}

  //- ================= FUNNEL & CANDIDATES =================
  .page-vacancy__funnel-section
    .page-vacancy__funnel-header
      h2.page-vacancy__section-title Воронка кандидатов ({{ candidates.length }})
      p.page-vacancy__section-sub Соискатели, прикрепленные к данной вакансии

    //- Funnel stages bar
    .page-vacancy__funnel-stages
      button.page-vacancy__stage-btn(
        type="button",
        :class="{ 'page-vacancy__stage-btn--active': selectedStage === 'all' }",
        @click="selectedStage = 'all'"
      )
        span.page-vacancy__stage-name Все кандидаты
        span.page-vacancy__stage-count {{ stats.total }}

      button.page-vacancy__stage-btn(
        type="button",
        :class="{ 'page-vacancy__stage-btn--active': selectedStage === 'new' }",
        @click="selectedStage = 'new'"
      )
        span.page-vacancy__stage-name 🆕 Новые
        span.page-vacancy__stage-count {{ stats.new }}

      button.page-vacancy__stage-btn(
        type="button",
        :class="{ 'page-vacancy__stage-btn--active': selectedStage === 'in_progress' }",
        @click="selectedStage = 'in_progress'"
      )
        span.page-vacancy__stage-name ⚙️ В обработке
        span.page-vacancy__stage-count {{ inProgressCount }}

      button.page-vacancy__stage-btn(
        type="button",
        :class="{ 'page-vacancy__stage-btn--active': selectedStage === 'interview' }",
        @click="selectedStage = 'interview'"
      )
        span.page-vacancy__stage-name 💬 Интервью
        span.page-vacancy__stage-count {{ stats.interview }}

      button.page-vacancy__stage-btn(
        type="button",
        :class="{ 'page-vacancy__stage-btn--active': selectedStage === 'accepted' }",
        @click="selectedStage = 'accepted'"
      )
        span.page-vacancy__stage-name ✅ Приняты
        span.page-vacancy__stage-count {{ stats.accepted }}

      button.page-vacancy__stage-btn(
        type="button",
        :class="{ 'page-vacancy__stage-btn--active': selectedStage === 'reserve' }",
        @click="selectedStage = 'reserve'"
      )
        span.page-vacancy__stage-name 📁 Резерв
        span.page-vacancy__stage-count {{ stats.reserve }}

      button.page-vacancy__stage-btn(
        type="button",
        :class="{ 'page-vacancy__stage-btn--active': selectedStage === 'rejected' }",
        @click="selectedStage = 'rejected'"
      )
        span.page-vacancy__stage-name ⛔ Отказ
        span.page-vacancy__stage-count {{ stats.rejected }}

    //- Candidates List
    .page-vacancy__candidates-list
      .page-vacancies__loading(v-if="isLoadingCandidates")
        .page-candidates__spinner
        | Загрузка кандидатов...
      .page-vacancies__empty(v-else-if="filteredCandidates.length === 0")
        UserX(:size="40")
        p На данном этапе кандидатов пока нет
      .page-candidates__list(v-else)
        CandidateCard(
          v-for="c in filteredCandidates",
          :key="c.id",
          :candidate="c",
          @status-change="openStatusModal(c)"
        )

  //- Candidate Status Modal
  CandidateStatusModal(
    v-model="showStatusModal",
    :candidate="selectedCandidate",
    @updated="loadCandidates"
  )

  //- Add Candidate Modal
  CandidateAddModal(
    v-model="showAddCandidateModal",
    @created="handleCandidateCreated"
  )

.page-vacancy.page-vacancy--skeleton(v-else-if="vacanciesStore.isLoading", aria-hidden="true")
  .page-vacancy__top
    UiSkeleton(width="140px", height="24px")
  .page-vacancy__header(style="margin-bottom: 24px;")
    .page-vacancy__headline(style="display: flex; flex-direction: column; gap: 8px;")
      UiSkeleton(width="300px", height="32px")
      UiSkeleton(width="200px", height="18px")
  .page-vacancy__info-grid(style="margin-bottom: 24px;")
    .page-vacancy__card(style="display: flex; flex-direction: column; gap: 12px;")
      UiSkeleton(width="160px", height="20px")
      UiSkeleton(width="100%", height="60px")
    .page-vacancy__card(style="display: flex; flex-direction: column; gap: 12px;")
      UiSkeleton(width="160px", height="20px")
      UiSkeleton(width="100%", height="60px")
  .page-vacancy__candidates
    UiSkeleton(width="180px", height="22px", style="margin-bottom: 16px;")
    CandidateCardSkeleton(v-for="i in 3", :key="i", variant="list")
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Building2, MapPin, Plus, UserX, UserCheck } from 'lucide-vue-next'
import { useVacanciesStore } from '~/stores/vacancies.store'
import { useToast } from '~/composables/useToast'
import UiSkeleton from '~/components/ui/UiSkeleton/UiSkeleton.vue'
import CandidateCardSkeleton from '~/components/candidates/CandidateCardSkeleton/CandidateCardSkeleton.vue'
import { calculateVacancyStats } from '~/utils/vacancy-stats'
import type { Candidate } from '~/types/candidate.types'

const route = useRoute()
const vacanciesStore = useVacanciesStore()
const supabase = useSupabaseClient()

const vacancy = computed(() => vacanciesStore.currentVacancy)
const candidates = ref<Candidate[]>([])
const isLoadingCandidates = ref(false)
const selectedStage = ref('all')
const orgUnitDirector = ref('')

const showStatusModal = ref(false)
const showAddCandidateModal = ref(false)
const selectedCandidate = ref<Candidate | null>(null)

const stats = computed(() => calculateVacancyStats(candidates.value))

const inProgressCount = computed(() => {
  return candidates.value.filter(c => c.status === 'in_progress').length
})

const filteredCandidates = computed(() => {
  if (selectedStage.value === 'all') return candidates.value
  if (selectedStage.value === 'new') {
    return candidates.value.filter(c => c.status === 'new')
  }
  if (selectedStage.value === 'in_progress') {
    return candidates.value.filter(c => c.status === 'in_progress')
  }
  if (selectedStage.value === 'interview') {
    return candidates.value.filter(c => c.status === 'interview_scheduled' || c.status === 'interview_done')
  }
  if (selectedStage.value === 'accepted') {
    return candidates.value.filter(c => c.status === 'offer_accepted')
  }
  if (selectedStage.value === 'reserve') {
    return candidates.value.filter(c => c.status === 'reserve')
  }
  if (selectedStage.value === 'rejected') {
    return candidates.value.filter(c => c.status === 'rejected' || c.status === 'self_rejected' || c.status === 'no_feedback')
  }
  return candidates.value
})

const loadCandidates = async () => {
  const id = route.params.id as string
  isLoadingCandidates.value = true
  try {
    const { data } = await supabase
      .from('candidates')
      .select('*')
      .eq('vacancy_id', id)
      .order('created_at', { ascending: false })
    candidates.value = data || []

    // Fetch org unit director if vacancy has org_unit_id
    if (vacancy.value?.org_unit_id) {
      const { data: orgData } = await supabase
        .from('org_units')
        .select('director_full_name')
        .eq('id', vacancy.value.org_unit_id)
        .single()
      orgUnitDirector.value = orgData?.director_full_name || ''
    }
  } finally {
    isLoadingCandidates.value = false
  }
}

onMounted(async () => {
  const id = route.params.id as string
  await vacanciesStore.fetchById(id)
  await loadCandidates()
})

const toast = useToast()

const toggle = async () => {
  if (!vacancy.value) return
  const success = await vacanciesStore.toggleOpen(vacancy.value.id, !vacancy.value.is_open)
  if (success) {
    toast.success(vacancy.value.is_open ? 'Вакансия открыта' : 'Вакансия закрыта')
  } else {
    toast.error('Не удалось изменить статус вакансии')
  }
}

const handleCandidateCreated = async () => {
  await loadCandidates()
  toast.success('Кандидат успешно добавлен к вакансии')
}

const openStatusModal = (candidate: Candidate) => {
  selectedCandidate.value = candidate
  showStatusModal.value = true
}
</script>

<style lang="scss">
.page-vacancy {
  &__top {
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
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-6);
    gap: 16px;
    flex-wrap: wrap;
  }

  &__headline {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__org-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  &__dot {
    margin: 0 2px;
  }
  
  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  &__info-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
    margin-bottom: var(--spacing-8);

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }
  
  &__card {
    padding: 24px;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    gap: 16px;

    &-title {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-secondary);
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 10px;
    }
  }

  &__text-block {
    display: flex;
    flex-direction: column;
    gap: 4px;

    p {
      font-size: 14px;
      color: var(--color-text-primary);
      line-height: 1.6;
    }
  }

  &__block-heading {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  &__empty-desc {
    font-size: 14px;
    color: var(--color-text-secondary);
    font-style: italic;
  }

  &__org-detail {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__org-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    color: var(--color-primary);
  }

  &__org-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__org-label {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  &__org-val {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  &__funnel-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__funnel-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__section-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  &__section-sub {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  &__funnel-stages {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 6px;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  &__stage-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: var(--radius-md);
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;

    &:hover {
      background-color: var(--color-bg-hover);
      color: var(--color-text-primary);
    }

    &--active {
      background-color: var(--color-primary);
      color: white !important;

      .page-vacancy__stage-count {
        background-color: rgba(255, 255, 255, 0.25);
        color: white;
      }
    }
  }

  &__stage-count {
    padding: 2px 7px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 700;
    background-color: var(--color-bg-body);
    color: var(--color-text-primary);
  }

  &__candidates-list {
    margin-top: 8px;
  }
}
</style>
