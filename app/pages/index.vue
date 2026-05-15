<template lang="pug">
.page-candidates
  .page-candidates__header
    h1.page-title Витрина кандидатов
    UiButton(variant="primary", @click="showAddModal = true")
      template(#icon)
        Plus(:size="18")
      | Добавить кандидата
      
  CandidateSearch(@search="handleSearch")
  
  .page-candidates__count(v-if="!candidatesStore.isLoading")
    | Всего {{ candidatesStore.candidates.length }} кандидатов
    
  .page-candidates__loading(v-if="candidatesStore.isLoading")
    .page-candidates__spinner
    | Загрузка...
    
  .page-candidates__empty(v-else-if="candidatesStore.candidates.length === 0")
    UserX(:size="48")
    p Кандидаты не найдены
    p.page-candidates__empty-hint Добавьте нового кандидата или измените параметры поиска
  
  .page-candidates__list(v-else)
    CandidateCard(
      v-for="candidate in candidatesStore.candidates",
      :key="candidate.id",
      :candidate="candidate",
      @status-change="openStatusModal"
    )
    
  CandidateAddModal(v-model="showAddModal")
  CandidateStatusModal(
    v-model="showStatusModal",
    :candidate="selectedCandidate",
    @updated="handleStatusUpdated"
  )
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, UserX } from 'lucide-vue-next'
import { useCandidatesStore } from '~/stores/candidates.store'
import type { Candidate } from '~/types/candidate.types'

const candidatesStore = useCandidatesStore()

const showAddModal = ref(false)
const showStatusModal = ref(false)
const selectedCandidate = ref<Candidate | null>(null)

onMounted(async () => {
  await candidatesStore.fetchAll()
})

const handleSearch = async (query: string) => {
  await candidatesStore.search(query)
}

const openStatusModal = (candidate: Candidate) => {
  selectedCandidate.value = candidate
  showStatusModal.value = true
}

const handleStatusUpdated = () => {
  candidatesStore.fetchAll()
}
</script>

<style lang="scss">
.page-candidates {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-6);
  }
  
  &__count {
    font-size: 14px;
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
  to { transform: rotate(360deg); }
}
</style>
