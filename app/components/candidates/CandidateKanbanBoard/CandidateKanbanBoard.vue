<template lang="pug">
.candidate-kanban
  .candidate-kanban__board
    .candidate-kanban__column(
      v-for="col in kanbanSections",
      :key="col.id",
      :class="{ 'candidate-kanban__column--drag-over': activeDragTarget === col.id }",
      @dragover.prevent="handleDragOver(col.id)",
      @dragenter.prevent="handleDragOver(col.id)",
      @dragleave="handleDragLeave(col.id)",
      @drop.prevent="handleDrop(col.id)"
    )
      .candidate-kanban__column-header
        .candidate-kanban__column-title
          span.candidate-kanban__column-dot(:style="{ backgroundColor: col.color }")
          h3 {{ col.title }}
        span.candidate-kanban__column-count {{ getCandidatesForColumn(col.id).length }}

      .candidate-kanban__column-body
        .candidate-kanban__empty(v-if="getCandidatesForColumn(col.id).length === 0")
          | Перетащите кандидата сюда

        .candidate-kanban__cards(v-else)
          .candidate-kanban__card(
            v-for="candidate in getCandidatesForColumn(col.id)",
            :key="candidate.id",
            draggable="true",
            @dragstart="handleDragStart($event, candidate)",
            @dragend="handleDragEnd",
            @click="navigateToCandidate(candidate.id)"
          )
            .candidate-kanban__card-header
              span.candidate-kanban__card-name {{ formatFullName(candidate) }}
              .candidate-kanban__card-actions
                button.candidate-kanban__card-menu-btn(
                  type="button",
                  title="Редактировать кандидата",
                  @click.stop="$emit('edit', candidate)"
                )
                  Edit(:size="14")
                button.candidate-kanban__card-menu-btn(
                  type="button",
                  title="Сменить статус",
                  @click.stop="$emit('statusChange', candidate)"
                )
                  ArrowRightLeft(:size="14")

            .candidate-kanban__card-meta
              .candidate-kanban__card-item(v-if="candidate.phone")
                Phone(:size="12")
                span {{ candidate.phone }}
              .candidate-kanban__card-item(v-if="getVacancyTitle(candidate.vacancy_id)")
                Briefcase(:size="12")
                span.candidate-kanban__card-vacancy {{ getVacancyTitle(candidate.vacancy_id) }}

            .candidate-kanban__card-footer
              span.candidate-kanban__card-date {{ formatDate(candidate.created_at) }}
              span.candidate-kanban__card-source {{ formatSource(candidate.source) }}
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Phone, Briefcase, ArrowRightLeft, Edit } from 'lucide-vue-next'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useCandidatesStore } from '~/stores/candidates.store'
import { useVacanciesStore } from '~/stores/vacancies.store'
import type { Candidate, CandidateStatus } from '~/types/candidate.types'
import { SOURCE_LABELS } from '~/types/candidate.types'

const emit = defineEmits<{
  (e: 'statusChange', candidate: Candidate, targetStatus?: CandidateStatus): void
  (e: 'edit', candidate: Candidate): void
}>()

const router = useRouter()
const candidatesStore = useCandidatesStore()
const vacanciesStore = useVacanciesStore()

interface KanbanSection {
  id: CandidateStatus | 'rejected_group'
  title: string
  color: string
}

const kanbanSections: KanbanSection[] = [
  { id: 'new', title: 'Новые', color: '#3b82f6' },
  { id: 'no_feedback', title: 'В обработке', color: '#f59e0b' },
  { id: 'interview_scheduled', title: 'Интервью', color: '#22c55e' },
  { id: 'reserve', title: 'Резерв', color: '#8b5cf6' },
  { id: 'rejected_group', title: 'Отказ / Самоотказ', color: '#ef4444' },
]

const draggedCandidate = ref<Candidate | null>(null)
const activeDragTarget = ref<string | null>(null)

const getCandidatesForColumn = (columnId: string): Candidate[] => {
  const cols = candidatesStore.kanbanColumns
  if (columnId === 'rejected_group') {
    return [...(cols.rejected || []), ...(cols.self_rejected || [])]
  }
  return cols[columnId as CandidateStatus] || []
}

const getVacancyTitle = (vacancyId: string | null): string => {
  if (!vacancyId) return ''
  const vac = vacanciesStore.vacancies.find(v => v.id === vacancyId)
  return vac ? vac.title : ''
}

const formatFullName = (c: Candidate): string => {
  const parts = [c.last_name, c.first_name]
  if (c.middle_name) parts.push(c.middle_name)
  return parts.join(' ')
}

const formatDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: ru })
  } catch {
    return dateStr
  }
}

const formatSource = (source: Candidate['source']): string => {
  return SOURCE_LABELS[source] || source
}

const navigateToCandidate = (id: string) => {
  router.push(`/candidates/${id}`)
}

const handleDragStart = (e: DragEvent, candidate: Candidate) => {
  draggedCandidate.value = candidate
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', candidate.id)
  }
}

const handleDragEnd = () => {
  draggedCandidate.value = null
  activeDragTarget.value = null
}

const handleDragOver = (columnId: string) => {
  activeDragTarget.value = columnId
}

const handleDragLeave = (columnId: string) => {
  if (activeDragTarget.value === columnId) {
    activeDragTarget.value = null
  }
}

const handleDrop = (columnId: string) => {
  if (!draggedCandidate.value) return
  activeDragTarget.value = null

  const targetStatus: CandidateStatus = columnId === 'rejected_group' ? 'rejected' : (columnId as CandidateStatus)

  if (draggedCandidate.value.status !== targetStatus) {
    emit('statusChange', draggedCandidate.value, targetStatus)
  }
  draggedCandidate.value = null
}
</script>

<style lang="scss">
.candidate-kanban {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 16px;

  &__board {
    display: flex;
    gap: 16px;
    min-width: 1100px;
    align-items: flex-start;
  }

  &__column {
    flex: 1;
    min-width: 240px;
    max-width: 320px;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 260px);
    transition: all 0.2s;

    &--drag-over {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      background-color: rgba(59, 130, 246, 0.03);
    }
  }

  &__column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--color-border);
  }

  &__column-title {
    display: flex;
    align-items: center;
    gap: 8px;

    h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }
  }

  &__column-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  &__column-count {
    font-size: 12px;
    font-weight: 600;
    padding: 2px 8px;
    background-color: var(--color-bg-body);
    border-radius: 12px;
    color: var(--color-text-secondary);
  }

  &__column-body {
    padding: 12px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 140px;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: 12px;
    text-align: center;
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__card {
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 12px;
    cursor: grab;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 8px;

    &:hover {
      border-color: var(--color-primary);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &:active {
      cursor: grabbing;
    }
  }

  &__card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  &__card-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1.3;
  }

  &__card-actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  &__card-menu-btn {
    background: transparent;
    border: none;
    padding: 4px;
    color: var(--color-text-secondary);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: var(--color-primary);
      background-color: rgba(59, 130, 246, 0.1);
    }
  }

  &__card-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__card-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  &__card-vacancy {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  &__card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: var(--color-text-secondary);
    padding-top: 6px;
    border-top: 1px solid var(--color-border);
  }

  &__card-source {
    padding: 1px 6px;
    background-color: var(--color-bg-card);
    border-radius: 4px;
    font-weight: 500;
  }
}
</style>
