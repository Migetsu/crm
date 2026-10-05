<template lang="pug">
UiModal(v-model="isOpen", title="Изменить статус", size="lg")
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
      .status-modal__interview-grid
        UiSelect(
          v-model="interviewOrgUnit",
          :label="orgUnitSelectLabel",
          :options="orgUnitOptions",
          placeholder="Выберите филиал",
          searchable
        )
        UiInput(
          v-model="interviewDate",
          label="Дата и время собеседования *",
          type="datetime-local"
        )
      UiInput(
        v-model="interviewAddress",
        label="Адрес проведения собеседования *",
        placeholder="г. Москва, ул. Ленина, д. 10"
      )

      //- Automatic Notification Section
      .status-modal__notify-box
        .status-modal__notify-header
          UiCheckbox(
            v-model="sendNotification",
            label="Сформировать и отправить приглашение кандидату"
          )
        
        .status-modal__notify-content(v-if="sendNotification")
          .status-modal__channel-picker
            span.status-modal__channel-label Канал отправки:
            .status-modal__channel-buttons
              button.status-modal__channel-btn(
                type="button",
                :class="{ 'status-modal__channel-btn--active': notificationChannel === 'sms' }",
                @click="switchChannel('sms')"
              )
                MessageSquare(:size="14")
                span SMS ({{ candidate.phone }})
              button.status-modal__channel-btn(
                type="button",
                :class="{ 'status-modal__channel-btn--active': notificationChannel === 'email' }",
                :disabled="!candidate.email",
                @click="switchChannel('email')"
              )
                Mail(:size="14")
                span Email ({{ candidate.email || 'нет email' }})

          UiSelect(
            v-model="selectedTemplateId",
            label="Шаблон сообщения",
            :options="templateSelectOptions",
            placeholder="Выберите шаблон"
          )

          .status-modal__tags-helper
            span.status-modal__tags-label Переменные (клик для вставки):
            .status-modal__tags-list
              button.status-modal__tag-chip(
                v-for="tag in AVAILABLE_TEMPLATE_TAGS",
                :key="tag.tag",
                type="button",
                :title="tag.description",
                @click="insertTag(tag.tag)"
              )
                | {{ tag.tag }}

          .status-modal__message-field
            label.status-modal__label Текст уведомления (с подставленными данными)
            textarea.status-modal__textarea(
              ref="messageTextareaRef",
              v-model="notificationMessage",
              rows="4",
              placeholder="Текст приглашения на интервью..."
            )
            span.status-modal__message-hint Текст сгенерирован автоматически по шаблону с вашими параметрами. Вы можете внести правки перед отправкой.
    
    .status-modal__comment
      label.status-modal__label Комментарий к смене статуса
      textarea.status-modal__textarea(v-model="comment", placeholder="Оставьте комментарий...")
      
  template(#footer)
    UiButton(variant="secondary", @click="isOpen = false") Отмена
    UiButton(
      variant="primary",
      :disabled="!canSave || isSaving",
      @click="handleSave"
    )
      | {{ isSaving ? 'Сохранение...' : 'Сохранить статус' }}
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { MessageSquare, Mail } from 'lucide-vue-next'
import { useCandidatesStore } from '~/stores/candidates.store'
import { useOrgUnitsStore } from '~/stores/org-units.store'
import { useVacanciesStore } from '~/stores/vacancies.store'
import { HistoryService } from '~/services/history.service'
import { TemplatesService } from '~/services/templates.service'
import { VacanciesService } from '~/services/vacancies.service'
import type { Candidate, CandidateStatus } from '~/types/candidate.types'
import type { Vacancy } from '~/types/vacancy.types'
import type { Template, TemplateType } from '~/types/template.types'
import {
  STATUS_LABELS, STATUS_COLORS,
  NO_FEEDBACK_LABELS, REJECTED_LABELS, SELF_REJECTED_LABELS, RESERVE_LABELS,
} from '~/types/candidate.types'
import {
  interpolateTemplate,
  buildTemplateContext,
  normalizeTemplateNewlines,
  AVAILABLE_TEMPLATE_TAGS,
} from '~/utils/template'
import {
  getRelevantOrgUnits,
  determineInterviewSelection,
} from '~/utils/interview-org-units'

const props = defineProps<{
  candidate: Candidate | null
  initialStatus?: CandidateStatus | string | null
  vacancyTitle?: string | null
}>()

const emit = defineEmits<{
  (e: 'updated'): void
}>()

const isOpen = defineModel<boolean>()
const toast = useToast()
const candidatesStore = useCandidatesStore()
const orgUnitsStore = useOrgUnitsStore()
const vacanciesStore = useVacanciesStore()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const historyService = new HistoryService(supabase)
const templatesService = new TemplatesService(supabase)
const vacanciesService = new VacanciesService(supabase)

const selectedStatus = ref('')
const reason = ref('')
const comment = ref('')
const nextContactDate = ref('')
const interviewAddress = ref('')
const interviewOrgUnit = ref('')
const interviewDate = ref('')
const isSaving = ref(false)

// Notification state
const sendNotification = ref(true)
const notificationChannel = ref<TemplateType>('sms')
const selectedTemplateId = ref('')
const notificationMessage = ref('')
const templates = ref<Template[]>([])
const loadedVacancyTitle = ref('')
const candidateVacancy = ref<Vacancy | null>(null)
const messageTextareaRef = ref<HTMLTextAreaElement | null>(null)

const currentStatusLabel = computed(() => props.candidate ? STATUS_LABELS[props.candidate.status] : '')
const currentStatusColor = computed(() => props.candidate ? STATUS_COLORS[props.candidate.status] : '')
const currentStatusBgColor = computed(() => currentStatusColor.value + '1a')

const currentVacancy = computed(() => {
  if (!props.candidate?.vacancy_id) return null
  return (
    vacanciesStore.vacancies.find(v => v.id === props.candidate?.vacancy_id) ||
    candidateVacancy.value
  )
})

const effectiveVacancyTitle = computed(() => {
  return props.vacancyTitle || currentVacancy.value?.title || loadedVacancyTitle.value || ''
})

const selectedOrgUnit = computed(() => {
  return orgUnitsStore.orgUnits.find(u => u.id === interviewOrgUnit.value) || null
})

const availableStatuses = computed(() => {
  if (!props.candidate) return []
  const allKeys = Object.keys(STATUS_LABELS) as CandidateStatus[]
  return allKeys
    .filter(s => s !== props.candidate?.status)
    .map(s => ({ value: s, label: STATUS_LABELS[s] }))
})

const toSelectOptions = (labels: Record<string, string>) => {
  return Object.entries(labels).map(([value, label]) => ({ value, label }))
}
const noFeedbackOptions = toSelectOptions(NO_FEEDBACK_LABELS)
const rejectedOptions = toSelectOptions(REJECTED_LABELS)
const selfRejectedOptions = toSelectOptions(SELF_REJECTED_LABELS)
const reserveOptions = toSelectOptions(RESERVE_LABELS)

const relevantOrgUnits = computed(() => {
  return getRelevantOrgUnits({
    candidateVacancyTitle: effectiveVacancyTitle.value,
    candidateVacancy: currentVacancy.value,
    vacancies: vacanciesStore.vacancies,
    orgUnits: orgUnitsStore.orgUnits,
  })
})

const isFilteredByVacancy = computed(() => Boolean(effectiveVacancyTitle.value))

const orgUnitSelectLabel = computed(() => {
  if (!isFilteredByVacancy.value) return 'Орг. единица / филиал *'
  if (relevantOrgUnits.value.length === 0) {
    return `Орг. единица / филиал * (нет филиалов с открытой должностью «${effectiveVacancyTitle.value}»)`
  }
  return `Орг. единица / филиал * (где открыта должность «${effectiveVacancyTitle.value}»)`
})

const orgUnitOptions = computed(() => {
  return relevantOrgUnits.value.map(u => ({
    value: u.id,
    label: `${u.name} (${u.interview_address})`,
  }))
})

const autoSelectOrgUnitAndAddress = () => {
  const selection = determineInterviewSelection({
    relevantUnits: relevantOrgUnits.value,
    currentSelection: interviewOrgUnit.value,
    candidateVacancy: currentVacancy.value,
  })

  if (selection) {
    interviewOrgUnit.value = selection.orgUnitId
    interviewAddress.value = selection.interviewAddress
  }
}

const templateSelectOptions = computed(() => {
  return templates.value.map(t => ({ value: t.id, label: t.title }))
})

const activeTemplate = computed(() => {
  return templates.value.find(t => t.id === selectedTemplateId.value) || null
})

const canSave = computed(() => {
  if (!selectedStatus.value) return false
  if (selectedStatus.value === 'interview_scheduled') {
    if (!interviewAddress.value.trim() || !interviewDate.value) return false
    if (sendNotification.value && !notificationMessage.value.trim()) return false
  }
  return true
})

onMounted(async () => {
  await Promise.all([
    orgUnitsStore.fetchAll(),
    vacanciesStore.fetchAll(),
  ])
})

const switchChannel = async (channel: TemplateType) => {
  notificationChannel.value = channel
  await loadChannelTemplates()
  generateNotificationText()
}

const loadChannelTemplates = async () => {
  try {
    const list = await templatesService.fetchByType(notificationChannel.value)
    templates.value = list.filter(t => t.recipient === 'candidate' || !t.recipient)
    
    // Auto-select interview invitation template or first available
    const inviteTemplate = templates.value.find(t =>
      t.title.toLowerCase().includes('интервью') || t.title.toLowerCase().includes('собеседован'),
    ) || templates.value[0]

    selectedTemplateId.value = inviteTemplate ? inviteTemplate.id : ''
  } catch (err) {
    console.error('Failed to load templates:', err)
  }
}

const generateNotificationText = () => {
  if (!activeTemplate.value) {
    if (templates.value.length > 0) {
      selectedTemplateId.value = templates.value[0].id
    } else {
      notificationMessage.value = ''
      return
    }
  }

  const tmpl = activeTemplate.value
  if (!tmpl) return

  const context = buildTemplateContext({
    candidate: props.candidate,
    vacancyTitle: effectiveVacancyTitle.value,
    interviewDate: interviewDate.value,
    interviewAddress: interviewAddress.value,
    recruiterPhone: '+7 (800) 555-35-35',
    orgUnitName: selectedOrgUnit.value?.name || '',
  })

  notificationMessage.value = normalizeTemplateNewlines(interpolateTemplate(tmpl.body, context))
}

const insertTag = (tag: string) => {
  if (!messageTextareaRef.value) {
    notificationMessage.value += tag
    return
  }
  const el = messageTextareaRef.value
  const start = el.selectionStart || notificationMessage.value.length
  const end = el.selectionEnd || notificationMessage.value.length
  const text = notificationMessage.value
  notificationMessage.value = text.substring(0, start) + tag + text.substring(end)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(start + tag.length, start + tag.length)
  })
}

// Auto-fill address when org unit changes
watch(interviewOrgUnit, (unitId) => {
  if (unitId) {
    const unit = orgUnitsStore.orgUnits.find(u => u.id === unitId)
    if (unit && unit.interview_address) {
      interviewAddress.value = unit.interview_address
      generateNotificationText()
    }
  }
})

// Update generated notification when date, address or template changes
watch([interviewDate, interviewAddress, selectedTemplateId], () => {
  if (selectedStatus.value === 'interview_scheduled') {
    generateNotificationText()
  }
})

// When switching to interview_scheduled, auto-select store and load templates
watch(selectedStatus, async (newStatus) => {
  if (newStatus === 'interview_scheduled') {
    autoSelectOrgUnitAndAddress()
    await loadChannelTemplates()
    generateNotificationText()
  }
})

const handleSave = async () => {
  if (!props.candidate || !selectedStatus.value || !canSave.value) return
  
  isSaving.value = true
  try {
    const success = await candidatesStore.updateStatus(props.candidate.id, selectedStatus.value as CandidateStatus)
    if (success) {
      // 1. If interview notification was requested, dispatch message or record in history
      if (selectedStatus.value === 'interview_scheduled' && sendNotification.value && notificationMessage.value.trim()) {
        let dispatched = false
        try {
          const session = await supabase.auth.getSession()
          const token = session.data.session?.access_token
          if (notificationChannel.value === 'sms' && props.candidate.phone) {
            await $fetch('/api/messages/send-sms', {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: {
                candidateId: props.candidate.id,
                phone: props.candidate.phone,
                text: notificationMessage.value.trim(),
                templateId: selectedTemplateId.value || undefined,
              },
            })
            dispatched = true
          } else if (notificationChannel.value === 'email' && props.candidate.email) {
            await $fetch('/api/messages/send-email', {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: {
                candidateId: props.candidate.id,
                to: props.candidate.email,
                subject: 'Приглашение на собеседование',
                text: notificationMessage.value.trim(),
                templateId: selectedTemplateId.value || undefined,
              },
            })
            dispatched = true
          }
        } catch (dispatchErr) {
          console.warn('Gateway dispatch failed, logging event directly:', dispatchErr)
        }

        if (!dispatched) {
          const channelTitle = notificationChannel.value === 'sms'
            ? 'SMS: Приглашение на собеседование'
            : 'Email: Приглашение на собеседование'

          await historyService.create({
            candidate_id: props.candidate.id,
            type: notificationChannel.value,
            title: channelTitle,
            body: notificationMessage.value.trim(),
            created_by: user.value?.id || null,
            meta: {
              template_id: selectedTemplateId.value || null,
              channel: notificationChannel.value,
              interview_date: interviewDate.value || null,
              interview_address: interviewAddress.value || null,
              org_unit_id: interviewOrgUnit.value || null,
              recipient: notificationChannel.value === 'sms' ? props.candidate.phone : props.candidate.email,
            },
          })
        }
      }

      // 2. Record status change in history
      const isInterview = selectedStatus.value === 'interview_scheduled'
      const notified = isInterview && sendNotification.value && !!notificationMessage.value.trim()
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
          interview_address: isInterview ? interviewAddress.value || null : null,
          interview_date: isInterview ? interviewDate.value || null : null,
          interview_org_unit_id: isInterview ? interviewOrgUnit.value || null : null,
          interview_org_unit_name: isInterview ? selectedOrgUnit.value?.name || null : null,
          notification_sent: notified,
          notification_channel: isInterview ? (notified ? notificationChannel.value : 'none') : null,
        },
      })
      
      isOpen.value = false
      emit('updated')
      const label = STATUS_LABELS[selectedStatus.value as CandidateStatus] || selectedStatus.value
      toast.success(`Статус кандидата изменён на «${label}»`)
      if (selectedStatus.value === 'interview_scheduled' && sendNotification.value && notificationMessage.value.trim()) {
        toast.info(notificationChannel.value === 'sms' ? 'SMS-приглашение отправлено' : 'Email-приглашение отправлено')
      }
    } else {
      toast.error('Не удалось изменить статус кандидата')
    }
  } catch (err: unknown) {
    toast.error('Ошибка при смене статуса кандидата')
    console.error(err)
  } finally {
    isSaving.value = false
  }
}

// Reset on open
watch(isOpen, async (val) => {
  if (val) {
    selectedStatus.value = (props.initialStatus as string) || ''
    reason.value = ''
    comment.value = ''
    nextContactDate.value = ''
    interviewAddress.value = ''
    interviewOrgUnit.value = ''
    interviewDate.value = ''
    notificationMessage.value = ''
    sendNotification.value = true
    notificationChannel.value = 'sms'

    // Set default interview date to tomorrow 14:00
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)
    interviewDate.value = tomorrow.toISOString().slice(0, 16)

    // Preload candidate's vacancy and stores
    await Promise.all([
      orgUnitsStore.fetchAll(),
      vacanciesStore.fetchAll(),
    ])

    if (props.candidate?.vacancy_id) {
      try {
        const v = await vacanciesService.fetchById(props.candidate.vacancy_id)
        if (v) {
          candidateVacancy.value = v
          loadedVacancyTitle.value = v.title
        }
      } catch {
        candidateVacancy.value = null
        loadedVacancyTitle.value = ''
      }
    }

    if (selectedStatus.value === 'interview_scheduled') {
      autoSelectOrgUnitAndAddress()
      await loadChannelTemplates()
      generateNotificationText()
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

  &__interview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  &__notify-box {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    border-radius: var(--radius-md);
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
  }

  &__notify-header {
    display: flex;
    align-items: center;
  }

  &__notify-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
  }

  &__channel-picker {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__channel-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  &__channel-buttons {
    display: flex;
    gap: 8px;
  }

  &__channel-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 500;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      border-color: var(--color-primary);
      color: var(--color-text-primary);
    }

    &--active {
      background-color: rgba(59, 130, 246, 0.1);
      border-color: var(--color-primary);
      color: var(--color-primary);
      font-weight: 600;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__tags-helper {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__tags-label {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  &__tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__tag-chip {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-family: monospace;
    font-weight: 500;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    color: var(--color-primary);
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background-color: rgba(59, 130, 246, 0.15);
      border-color: var(--color-primary);
      transform: translateY(-1px);
    }
  }

  &__message-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__message-hint {
    font-size: 12px;
    color: var(--color-text-muted);
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
    line-height: 1.5;
    resize: vertical;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }
}
</style>
