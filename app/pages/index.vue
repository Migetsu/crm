<template lang="pug">
.page-candidates
  .page-candidates__header
    .page-candidates__headline
      h1.page-title Витрина кандидатов
      p.page-candidates__subtitle Управление базой кандидатов, воронкой найма и статусами

    UiButton(variant="primary", @click="showAddModal = true")
      template(#icon)
        Plus(:size="18")
      | Добавить кандидата

  CandidateFilterBar

  //- Skeleton Loaders when loading
  template(v-if="candidatesStore.isLoading")
    //- Kanban Skeleton
    .candidate-kanban(v-if="candidatesStore.viewMode === 'kanban'")
      .candidate-kanban__board
        .candidate-kanban__column(v-for="i in 5", :key="i")
          .candidate-kanban__column-header
            .candidate-kanban__column-title(style="display: flex; align-items: center; gap: 8px; width: 100%;")
              UiSkeleton(width="10px", height="10px", border-radius="50%", variant="circle")
              UiSkeleton(width="90px", height="16px")
            UiSkeleton(width="24px", height="18px", border-radius="10px")
          .candidate-kanban__column-body
            .candidate-kanban__cards
              CandidateCardSkeleton(v-for="j in 2", :key="j", variant="kanban")

    //- List Skeleton
    template(v-else)
      .page-candidates__count
        UiSkeleton(width="180px", height="16px")
      .page-candidates__list
        CandidateCardSkeleton(v-for="i in 5", :key="i", variant="list")

  template(v-else)
    //- Kanban View
    CandidateKanbanBoard(
      v-if="candidatesStore.viewMode === 'kanban'",
      @status-change="openStatusModal"
    )

    //- List View
    template(v-else)
      .page-candidates__count
        | Всего найдено: {{ candidatesStore.totalCount }} кандидатов

      .page-candidates__empty(v-if="candidatesStore.candidates.length === 0")
        UserX(:size="48")
        p Кандидаты не найдены
        p.page-candidates__empty-hint Попробуйте изменить параметры фильтрации или поиска

      .page-candidates__list(v-else)
        CandidateCard(
          v-for="candidate in candidatesStore.candidates",
          :key="candidate.id",
          :candidate="candidate",
          @status-change="openStatusModal(candidate)"
        )

      CandidatePagination

  CandidateAddModal(v-model="showAddModal", @created="handleCandidateCreated")
  CandidateStatusModal(
    v-model="showStatusModal",
    :candidate="selectedCandidate",
    :initial-status="selectedTargetStatus",
    @updated="handleStatusUpdated"
  )
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, UserX } from 'lucide-vue-next'
import { useCandidatesStore } from '~/stores/candidates.store'
import CandidateCardSkeleton from '~/components/candidates/CandidateCardSkeleton/CandidateCardSkeleton.vue'
import UiSkeleton from '~/components/ui/UiSkeleton/UiSkeleton.vue'
import type { Candidate, CandidateStatus } from '~/types/candidate.types'

const candidatesStore = useCandidatesStore()

const showAddModal = ref(false)
const showStatusModal = ref(false)
const selectedCandidate = ref<Candidate | null>(null)
const selectedTargetStatus = ref<CandidateStatus | null>(null)

onMounted(async () => {
  await candidatesStore.fetchAll()
})

const openStatusModal = (candidate: Candidate, targetStatus?: CandidateStatus) => {
  selectedCandidate.value = candidate
  selectedTargetStatus.value = targetStatus || null
  showStatusModal.value = true
}

const handleStatusUpdated = async () => {
  await candidatesStore.fetchWithFilters()
}

const handleCandidateCreated = async () => {
  await candidatesStore.fetchWithFilters()
}
</script>

<style lang="scss">
.page-candidates {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-6);
    flex-wrap: wrap;
    gap: 16px;
  }

  &__headline {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__subtitle {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  &__count {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-4);
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 0;
    color: var(--color-text-secondary);
  }

  &__spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    color: var(--color-text-secondary);
    gap: 8px;

    &-hint {
      font-size: 14px;
      opacity: 0.7;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
