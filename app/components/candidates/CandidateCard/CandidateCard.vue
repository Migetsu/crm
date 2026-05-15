<template lang="pug">
article.candidate-card(@click="navigateToCandidate")
  .candidate-card__left
    .candidate-card__avatar(:style="{ backgroundColor: avatarColor }")
      | {{ initials }}
    .candidate-card__info
      .candidate-card__name {{ fullName }}
      .candidate-card__meta
        span.candidate-card__phone
          Phone(:size="14")
          | {{ candidate.phone }}
        span.candidate-card__email(v-if="candidate.email")
          Mail(:size="14")
          | {{ candidate.email }}
  .candidate-card__right
    .candidate-card__status(:style="{ backgroundColor: statusBgColor, color: statusColor }")
      | {{ statusLabel }}
    .candidate-card__date {{ formattedDate }}
    UiButton.candidate-card__action(
      variant="secondary",
      size="sm",
      @click.stop="$emit('statusChange', candidate)"
    ) Изменить статус
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Phone, Mail } from 'lucide-vue-next'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Candidate } from '~/types/candidate.types'
import { STATUS_LABELS, STATUS_COLORS } from '~/types/candidate.types'

const props = defineProps<{
  candidate: Candidate
}>()

defineEmits<{
  (e: 'statusChange', candidate: Candidate): void
}>()

const router = useRouter()

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

const statusLabel = computed(() => STATUS_LABELS[props.candidate.status])
const statusColor = computed(() => STATUS_COLORS[props.candidate.status])
const statusBgColor = computed(() => statusColor.value + '1a')

const formattedDate = computed(() => {
  try {
    return format(new Date(props.candidate.created_at), 'd MMMM yyyy', { locale: ru })
  } catch {
    return props.candidate.created_at
  }
})

const navigateToCandidate = () => {
  router.push(`/candidates/${props.candidate.id}`)
}
</script>

<style lang="scss">
.candidate-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--color-primary);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &__left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  &__avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 16px;
    flex-shrink: 0;
  }
  
  &__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  &__name {
    font-weight: 600;
    font-size: 15px;
    color: var(--color-text-primary);
  }
  
  &__meta {
    display: flex;
    gap: 16px;
  }
  
  &__phone,
  &__email {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  
  &__right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  &__status {
    padding: 4px 12px;
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }
  
  &__date {
    font-size: 13px;
    color: var(--color-text-secondary);
    white-space: nowrap;
  }
}
</style>
