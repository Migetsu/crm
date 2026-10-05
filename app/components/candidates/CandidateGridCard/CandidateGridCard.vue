<template lang="pug">
article.candidate-grid-card(@click="navigateToCandidate")
  .candidate-grid-card__header
    .candidate-grid-card__avatar(:style="{ backgroundColor: avatarColor }")
      | {{ initials }}
    .candidate-grid-card__header-right
      .candidate-grid-card__status(:style="{ backgroundColor: statusBgColor, color: statusColor }")
        | {{ statusLabel }}
      UiButton.candidate-grid-card__edit-btn(
        variant="ghost",
        size="sm",
        title="Редактировать кандидата",
        @click.stop="$emit('edit', candidate)"
      )
        template(#icon)
          Edit(:size="14")

  .candidate-grid-card__body
    h3.candidate-grid-card__name {{ fullName }}

    .candidate-grid-card__vacancy(v-if="vacancyTitle")
      Briefcase(:size="13")
      span {{ vacancyTitle }}

    .candidate-grid-card__contacts
      .candidate-grid-card__contact
        Phone(:size="13")
        span {{ candidate.phone }}
      .candidate-grid-card__contact(v-if="candidate.email")
        Mail(:size="13")
        span.candidate-grid-card__contact-email {{ candidate.email }}
      .candidate-grid-card__contact(v-if="candidate.address")
        MapPin(:size="13")
        span {{ candidate.address }}

  .candidate-grid-card__footer
    .candidate-grid-card__meta
      span.candidate-grid-card__source {{ sourceLabel }}
      span.candidate-grid-card__dot ·
      span.candidate-grid-card__date {{ formattedDate }}
    UiButton.candidate-grid-card__status-btn(
      variant="secondary",
      size="sm",
      @click.stop="$emit('statusChange', candidate)"
    ) Изменить статус
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Phone, Mail, MapPin, Briefcase, Edit } from 'lucide-vue-next'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useVacanciesStore } from '~/stores/vacancies.store'
import type { Candidate } from '~/types/candidate.types'
import { STATUS_LABELS, STATUS_COLORS, SOURCE_LABELS } from '~/types/candidate.types'
import UiButton from '~/components/ui/UiButton/UiButton.vue'

const props = defineProps<{
  candidate: Candidate
}>()

const emit = defineEmits<{
  statusChange: [candidate: Candidate]
  edit: [candidate: Candidate]
}>()

const router = useRouter()
const vacanciesStore = useVacanciesStore()

const fullName = computed(() => {
  const parts = [props.candidate.last_name, props.candidate.first_name]
  if (props.candidate.middle_name) parts.push(props.candidate.middle_name)
  return parts.join(' ')
})

const initials = computed(() => {
  return (props.candidate.last_name[0] + props.candidate.first_name[0]).toUpperCase()
})

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316',
]

const avatarColor = computed(() => {
  let hash = 0
  for (const char of props.candidate.id) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
})

const vacancyTitle = computed(() => {
  if (!props.candidate.vacancy_id) return null
  return vacanciesStore.vacancies.find(v => v.id === props.candidate.vacancy_id)?.title || null
})

const statusLabel = computed(() => STATUS_LABELS[props.candidate.status])
const statusColor = computed(() => STATUS_COLORS[props.candidate.status])
const statusBgColor = computed(() => statusColor.value + '1a')
const sourceLabel = computed(() => SOURCE_LABELS[props.candidate.source] || props.candidate.source)

const formattedDate = computed(() => {
  try {
    return format(new Date(props.candidate.created_at), 'd MMM yyyy', { locale: ru })
  } catch {
    return props.candidate.created_at
  }
})

const navigateToCandidate = () => {
  router.push(`/candidates/${props.candidate.id}`)
}
</script>

<style lang="scss">
.candidate-grid-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 220px;

  &:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 14px;
    flex-shrink: 0;
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  &__status {
    padding: 3px 10px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }

  &__edit-btn {
    padding: 4px;
    height: 28px;
    width: 28px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    margin-bottom: 16px;
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1.35;
    margin: 0;
  }

  &__vacancy {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-primary);
    background-color: rgba(59, 130, 246, 0.08);
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    width: fit-content;
  }

  &__contacts {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 4px;
  }

  &__contact {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  &__contact-email {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
  }

  &__footer {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  &__dot {
    opacity: 0.6;
  }

  &__status-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
