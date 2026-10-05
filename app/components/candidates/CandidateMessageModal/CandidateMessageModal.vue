<template lang="pug">
UiModal(v-model="isOpen", :title="modalTitle", size="md")
  .message-modal(v-if="candidate")
    .message-modal__recipient-badge
      component(:is="type === 'sms' ? Phone : Mail", :size="16")
      span.message-modal__recipient-text
        strong Получатель: 
        | {{ candidateFullName }} ({{ recipientContact }})

    UiSelect(
      v-model="selectedTemplateId",
      label="Шаблон сообщения",
      :options="templateOptions",
      placeholder="Выберите шаблон или напишите вручную"
    )

    //- Template custom variables if detected
    .message-modal__variables(v-if="neededVariables.length > 0")
      span.message-modal__variables-title Переменные шаблона:
      .message-modal__variables-grid
        UiInput(
          v-for="vName in neededVariables",
          :key="vName",
          v-model="variableValues[vName]",
          :label="vName",
          @update:model-value="applyTemplateVariables"
        )

    .message-modal__tags-helper
      span.message-modal__tags-label Быстрая вставка тега:
      .message-modal__tags-list
        button.message-modal__tag-chip(
          v-for="tag in AVAILABLE_TEMPLATE_TAGS",
          :key="tag.tag",
          type="button",
          :title="tag.description",
          @click="insertTag(tag.tag)"
        )
          | {{ tag.tag }}

    UiInput(
      v-if="type === 'email'",
      v-model="subject",
      label="Тема письма *",
      placeholder="Тема сообщения"
    )

    .message-modal__field
      label.message-modal__label Текст сообщения *
      textarea.message-modal__textarea(
        ref="textareaRef",
        v-model="messageBody",
        placeholder="Введите текст сообщения...",
        rows="5"
      )

  template(#footer)
    UiButton(variant="secondary", @click="isOpen = false") Отмена
    UiButton(
      variant="primary",
      :disabled="!canSend || isSubmitting",
      @click="handleSend"
    )
      template(#icon)
        Send(:size="15")
      | {{ isSubmitting ? 'Отправка...' : sendButtonText }}
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Phone, Mail, Send } from 'lucide-vue-next'
import { TemplatesService } from '~/services/templates.service'
import { HistoryService } from '~/services/history.service'
import {
  interpolateTemplate,
  extractTemplateVariables,
  buildTemplateContext,
  AVAILABLE_TEMPLATE_TAGS,
} from '~/utils/template'
import type { Candidate } from '~/types/candidate.types'
import type { Vacancy } from '~/types/vacancy.types'
import type { Template, TemplateType } from '~/types/template.types'

const props = defineProps<{
  type: TemplateType
  candidate: Candidate | null
  vacancy?: Vacancy | null
}>()

const emit = defineEmits<{
  (e: 'sent'): void
}>()

const isOpen = defineModel<boolean>()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const templatesService = new TemplatesService(supabase)
const historyService = new HistoryService(supabase)

const templates = ref<Template[]>([])
const selectedTemplateId = ref('')
const subject = ref('')
const messageBody = ref('')
const isSubmitting = ref(false)
const variableValues = ref<Record<string, string>>({})
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const modalTitle = computed(() => {
  return props.type === 'sms' ? 'Отправить SMS кандидату' : 'Отправить Email кандидату'
})

const sendButtonText = computed(() => {
  return props.type === 'sms' ? 'Отправить SMS' : 'Отправить Email'
})

const candidateFullName = computed(() => {
  if (!props.candidate) return ''
  return [props.candidate.last_name, props.candidate.first_name, props.candidate.middle_name]
    .filter(Boolean)
    .join(' ')
})

const recipientContact = computed(() => {
  if (!props.candidate) return ''
  return props.type === 'sms' ? props.candidate.phone : props.candidate.email || 'email не указан'
})

const templateOptions = computed(() => {
  return [
    { value: '', label: '— Без шаблона (произвольный текст) —' },
    ...templates.value.map(t => ({ value: t.id, label: t.title })),
  ]
})

const activeTemplate = computed(() => {
  return templates.value.find(t => t.id === selectedTemplateId.value) || null
})

const neededVariables = computed(() => {
  if (!activeTemplate.value) return []
  const allVars = extractTemplateVariables(activeTemplate.value.body)
  const standard = [
    'ФИО', 'ФИО кандидата', 'Имя', 'имя', 'вакансия', 'Вакансия',
    'ТелефонРекрутера', 'телефон', 'ОргЕдиница', 'филиал',
  ]
  return allVars.filter(v => !standard.includes(v))
})

const canSend = computed(() => {
  if (!messageBody.value.trim()) return false
  if (props.type === 'email' && !subject.value.trim()) return false
  if (props.type === 'email' && !props.candidate?.email) return false
  return true
})

const applyTemplateVariables = () => {
  if (!activeTemplate.value) return
  const context = buildTemplateContext({
    candidate: props.candidate,
    vacancyTitle: props.vacancy?.title || '',
    interviewAddress: props.candidate?.address || '',
    recruiterPhone: '+7 (800) 555-35-35',
    customVariables: variableValues.value,
  })

  messageBody.value = interpolateTemplate(activeTemplate.value.body, context)
}

const insertTag = (tag: string) => {
  if (!textareaRef.value) {
    messageBody.value += tag
    return
  }
  const el = textareaRef.value
  const start = el.selectionStart || messageBody.value.length
  const end = el.selectionEnd || messageBody.value.length
  const text = messageBody.value
  messageBody.value = text.substring(0, start) + tag + text.substring(end)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(start + tag.length, start + tag.length)
  })
}

watch(selectedTemplateId, (newId) => {
  if (!newId) return
  const tpl = templates.value.find(t => t.id === newId)
  if (!tpl) return

  if (props.type === 'email') {
    subject.value = tpl.title
  }

  // Prepopulate variables
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  variableValues.value['ДатаИнтервью'] = tomorrow.toLocaleDateString('ru-RU') + ' в 14:00'
  variableValues.value['дата'] = tomorrow.toLocaleDateString('ru-RU')
  variableValues.value['время'] = '14:00'
  variableValues.value['АдресИнтервью'] = props.candidate?.address || ''
  variableValues.value['адрес'] = props.candidate?.address || ''

  applyTemplateVariables()
})

const loadTemplates = async () => {
  try {
    const list = await templatesService.fetchByType(props.type)
    templates.value = list.filter(t => t.recipient === 'candidate' || !t.recipient)
  } catch (err) {
    console.error('Failed to load templates:', err)
  }
}

const handleSend = async () => {
  if (!props.candidate || !canSend.value) return

  isSubmitting.value = true
  try {
    const title = props.type === 'sms'
      ? (activeTemplate.value ? `SMS: «${activeTemplate.value.title}»` : 'Отправлено SMS')
      : (subject.value ? `Email: ${subject.value}` : 'Отправлен Email')

    await historyService.create({
      candidate_id: props.candidate.id,
      type: props.type,
      title,
      body: messageBody.value.trim(),
      created_by: user.value?.id || null,
      meta: {
        template_id: selectedTemplateId.value || null,
        recipient: props.type === 'sms' ? props.candidate.phone : props.candidate.email,
        phone: props.candidate.phone,
        email: props.candidate.email,
        subject: props.type === 'email' ? subject.value.trim() : null,
      },
    })

    isOpen.value = false
    emit('sent')
  } finally {
    isSubmitting.value = false
  }
}

watch(isOpen, async (val) => {
  if (val) {
    selectedTemplateId.value = ''
    subject.value = ''
    messageBody.value = ''
    variableValues.value = {}
    await loadTemplates()
  }
})
</script>

<style lang="scss">
.message-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__recipient-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
  }

  &__recipient-text {
    font-size: 13px;
    strong {
      color: var(--color-text-primary);
    }
  }

  &__variables {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background-color: var(--color-bg-body);
    border-radius: var(--radius-md);
  }

  &__variables-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-secondary);
  }

  &__variables-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
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

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  &__textarea {
    width: 100%;
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
