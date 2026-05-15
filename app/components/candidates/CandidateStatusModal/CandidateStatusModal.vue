<template lang="pug">
UiModal(v-model="isOpen", title="Изменить статус", size="md")
  .status-modal(v-if="candidate")
    .status-modal__current
      span.status-modal__current-label Текущий статус:
      span.status-modal__current-badge(:style="{ backgroundColor: currentStatusBgColor, color: currentStatusColor }")
        | {{ currentStatusLabel }}
        
    UiSelect(
      v-model="selectedStatus",
      label="Новый статус *",
      :options="availableStatuses",
      placeholder="Выберите статус"
    )
    
    //- Reason selects per status
    UiSelect(
      v-if="selectedStatus === 'no_feedback'",
      v-model="reason",
      label="Причина *",
      :options="noFeedbackOptions",
      placeholder="Выберите причину"
    )
    UiSelect(
      v-if="selectedStatus === 'rejected'",
      v-model="reason",
      label="Причина *",
      :options="rejectedOptions",
      placeholder="Выберите причину"
    )
    UiSelect(
      v-if="selectedStatus === 'self_rejected'",
      v-model="reason",
      label="Причина *",
      :options="selfRejectedOptions",
      placeholder="Выберите причину"
    )
    UiSelect(
      v-if="selectedStatus === 'reserve'",
      v-model="reason",
      label="Причина *",
      :options="reserveOptions",
      placeholder="Выберите причину"
    )
    UiInput(
      v-if="selectedStatus === 'reserve'",
      v-model="nextContactDate",
      label="Дата следующего контакта *",
      type="datetime-local"
    )
    
    //- Interview scheduled fields
    template(v-if="selectedStatus === 'interview_scheduled'")
      UiInput(v-model="interviewAddress", label="Адрес *", placeholder="Адрес проведения")
      UiSelect(
        v-model="interviewOrgUnit",
        label="Орг. единица *",
        :options="orgUnitOptions",
        placeholder="Выберите орг. единицу",
        searchable
      )
      UiInput(v-model="interviewDate", label="Дата и время *", type="datetime-local")
    
    .status-modal__comment
      label.status-modal__label Комментарий
      textarea.status-modal__textarea(v-model="comment", placeholder="Оставьте комментарий...")
      
  template(#footer)
    UiButton(variant="secondary", @click="isOpen = false") Отмена
    UiButton(variant="primary", @click="handleSave", :disabled="!selectedStatus || isSaving")
      | {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCandidatesStore } from '~/stores/candidates.store'
import { useOrgUnitsStore } from '~/stores/org-units.store'
import { HistoryService } from '~/services/history.service'
import type { Candidate, CandidateStatus } from '~/types/candidate.types'
import {
  STATUS_LABELS, STATUS_COLORS, STATUS_TRANSITIONS,
  NO_FEEDBACK_LABELS, REJECTED_LABELS, SELF_REJECTED_LABELS, RESERVE_LABELS,
} from '~/types/candidate.types'

const props = defineProps<{
  candidate: Candidate | null
}>()

const emit = defineEmits<{
  (e: 'updated'): void
}>()

const isOpen = defineModel<boolean>()
const candidatesStore = useCandidatesStore()
const orgUnitsStore = useOrgUnitsStore()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const historyService = new HistoryService(supabase as any)

const selectedStatus = ref('')
const reason = ref('')
const comment = ref('')
const nextContactDate = ref('')
const interviewAddress = ref('')
const interviewOrgUnit = ref('')
const interviewDate = ref('')
const isSaving = ref(false)

const currentStatusLabel = computed(() => props.candidate ? STATUS_LABELS[props.candidate.status] : '')
const currentStatusColor = computed(() => props.candidate ? STATUS_COLORS[props.candidate.status] : '')
const currentStatusBgColor = computed(() => currentStatusColor.value + '1a')

const availableStatuses = computed(() => {
  if (!props.candidate) return []
  const transitions = STATUS_TRANSITIONS[props.candidate.status] || []
  return transitions.map(s => ({ value: s, label: STATUS_LABELS[s] }))
})

const toSelectOptions = (labels: Record<string, string>) => {
  return Object.entries(labels).map(([value, label]) => ({ value, label }))
}
const noFeedbackOptions = toSelectOptions(NO_FEEDBACK_LABELS)
const rejectedOptions = toSelectOptions(REJECTED_LABELS)
const selfRejectedOptions = toSelectOptions(SELF_REJECTED_LABELS)
const reserveOptions = toSelectOptions(RESERVE_LABELS)

const orgUnitOptions = computed(() => {
  return orgUnitsStore.orgUnits.map(u => ({ value: u.id, label: u.name }))
})

onMounted(async () => {
  await orgUnitsStore.fetchAll()
})

const handleSave = async () => {
  if (!props.candidate || !selectedStatus.value) return
  
  isSaving.value = true
  try {
    const success = await candidatesStore.updateStatus(props.candidate.id, selectedStatus.value as CandidateStatus)
    if (success) {
      await historyService.create({
        candidate_id: props.candidate.id,
        type: 'status_change',
        title: `Статус изменён на «${STATUS_LABELS[selectedStatus.value as CandidateStatus]}»`,
        body: comment.value.trim() || null,
        created_by: user.value?.id || null,
        meta: {
          from_status: props.candidate.status,
          to_status: selectedStatus.value,
          reason: reason.value || null,
          next_contact_date: nextContactDate.value || null,
          interview_address: interviewAddress.value || null,
          interview_date: interviewDate.value || null,
        },
      })
      
      isOpen.value = false
      emit('updated')
    }
  } finally {
    isSaving.value = false
  }
}

// Reset on open
watch(isOpen, (val) => {
  if (val) {
    selectedStatus.value = ''
    reason.value = ''
    comment.value = ''
    nextContactDate.value = ''
    interviewAddress.value = ''
    interviewOrgUnit.value = ''
    interviewDate.value = ''
    if (props.candidate?.address) {
      interviewAddress.value = props.candidate.address
    }
  }
})
</script>

<style lang="scss">
.status-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  &__current {
    display: flex;
    align-items: center;
    gap: 8px;
    
    &-label {
      font-size: 14px;
      color: var(--color-text-secondary);
    }
    
    &-badge {
      padding: 4px 12px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 600;
    }
  }
  
  &__label {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  
  &__textarea {
    width: 100%;
    min-height: 80px;
    padding: 10px 12px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 14px;
    resize: vertical;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }
}
</style>
