<template lang="pug">
.candidate-pagination(v-if="candidatesStore.totalCount > 0")
  .candidate-pagination__info
    | Показано {{ rangeStart }}–{{ rangeEnd }} из {{ candidatesStore.totalCount }}

  .candidate-pagination__controls
    .candidate-pagination__page-size
      span.candidate-pagination__size-label На странице:
      select.candidate-pagination__size-select(
        :value="candidatesStore.pageSize",
        @change="handlePageSizeChange"
      )
        option(value="10") 10
        option(value="25") 25
        option(value="50") 50

    .candidate-pagination__nav
      button.candidate-pagination__btn(
        type="button",
        :disabled="candidatesStore.page <= 1",
        title="Первая страница",
        @click="candidatesStore.setPage(1)"
      )
        ChevronsLeft(:size="16")

      button.candidate-pagination__btn(
        type="button",
        :disabled="candidatesStore.page <= 1",
        title="Предыдущая страница",
        @click="candidatesStore.setPage(candidatesStore.page - 1)"
      )
        ChevronLeft(:size="16")

      span.candidate-pagination__page-indicator
        | {{ candidatesStore.page }} / {{ candidatesStore.totalPages }}

      button.candidate-pagination__btn(
        type="button",
        :disabled="candidatesStore.page >= candidatesStore.totalPages",
        title="Следующая страница",
        @click="candidatesStore.setPage(candidatesStore.page + 1)"
      )
        ChevronRight(:size="16")

      button.candidate-pagination__btn(
        type="button",
        :disabled="candidatesStore.page >= candidatesStore.totalPages",
        title="Последняя страница",
        @click="candidatesStore.setPage(candidatesStore.totalPages)"
      )
        ChevronsRight(:size="16")
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import { useCandidatesStore } from '~/stores/candidates.store'

const candidatesStore = useCandidatesStore()

const rangeStart = computed(() => {
  if (candidatesStore.totalCount === 0) return 0
  return (candidatesStore.page - 1) * candidatesStore.pageSize + 1
})

const rangeEnd = computed(() => {
  return Math.min(candidatesStore.page * candidatesStore.pageSize, candidatesStore.totalCount)
})

const handlePageSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  candidatesStore.setPageSize(Number(target.value))
}
</script>

<style lang="scss">
.candidate-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-4);
  flex-wrap: wrap;
  gap: 16px;

  &__info {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  &__page-size {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__size-label {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  &__size-select {
    padding: 6px 10px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: 13px;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--color-border);
    background-color: var(--color-bg-body);
    color: var(--color-text-primary);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__page-indicator {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
    padding: 0 8px;
  }
}
</style>
