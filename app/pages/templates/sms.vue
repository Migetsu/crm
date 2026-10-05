<template lang="pug">
.page-templates
  .page-templates__header
    div
      h1.page-title Шаблоны SMS
      p.page-subtitle Управление текстовыми шаблонами для соискателей и руководителей
    UiButton(variant="primary", @click="openCreate")
      template(#icon)
        Plus(:size="18")
      | Добавить шаблон
      
  .page-vacancies__loading(v-if="templatesStore.isLoading && !templatesStore.templates.length")
    .page-candidates__spinner
    | Загрузка...
    
  .page-vacancies__empty(v-else-if="templatesStore.templates.length === 0")
    Mail(:size="48")
    p SMS-шаблоны не найдены
    
  .page-templates__list(v-else)
    .template-card(v-for="tmpl in templatesStore.templates", :key="tmpl.id")
      .template-card__header
        .template-card__title-row
          h3.template-card__title {{ tmpl.title }}
          .template-card__badge {{ getRecipientTitle(tmpl.recipient) }}
        .template-card__actions
          UiButton(variant="ghost", size="sm", @click="openEdit(tmpl)")
            template(#icon)
              Edit(:size="14")
            | Редактировать
          UiButton(variant="ghost", size="sm", @click="copyText(tmpl.body)")
            template(#icon)
              Copy(:size="14")
            | Копировать
          UiButton(variant="ghost", size="sm", title="Удалить", @click="handleDelete(tmpl.id)")
            template(#icon)
              Trash2(:size="14")

      .template-card__tags(v-if="getTemplateTags(tmpl.body).length > 0")
        span.template-card__tags-label Переменные:
        .template-card__tags-list
          span.template-card__tag(v-for="t in getTemplateTags(tmpl.body)", :key="t")
            | {{ formatTag(t) }}

      p.template-card__body {{ tmpl.body }}

      .template-card__preview-box
        span.template-card__preview-label Пример с подстановкой:
        p.template-card__preview-text {{ renderPreview(tmpl.body) }}

  //- Edit / Create Modal
  UiModal(
    v-model="showModal",
    :title="isEditing ? 'Редактировать шаблон SMS' : 'Новый шаблон SMS'",
    size="lg"
  )
    .template-form
      .template-form__grid
        UiInput(
          v-model="formData.title",
          label="Название шаблона *",
          placeholder="Например, Приглашение на интервью"
        )
        UiSelect(
          v-model="formData.recipient",
          label="Получатель *",
          :options="recipientOptions"
        )

      .template-form__tags
        .template-form__tags-header
          span.template-form__tags-title Доступные переменные (клик для вставки):
          span.template-form__tags-hint Вставляются в текст сообщения
        .template-form__tags-list
          button.template-form__tag-btn(
            v-for="tag in AVAILABLE_TEMPLATE_TAGS",
            :key="tag.tag",
            type="button",
            :title="tag.description",
            @click="insertTag(tag.tag)"
          )
            strong {{ tag.tag }}
            span.template-form__tag-desc — {{ tag.description }}

      .template-form__field
        label.template-form__label Текст шаблона *
        textarea.template-form__textarea(
          ref="textareaRef",
          v-model="formData.body",
          rows="5",
          placeholder="Здравствуйте, {Имя}! Приглашаем вас на вакансию {Вакансия}..."
        )

      //- Live Preview inside Modal
      .template-form__live-preview
        .template-form__preview-header
          Eye(:size="14")
          span Предпросмотр с тестовыми данными:
        .template-form__preview-bubble
          | {{ livePreviewModalText }}

    template(#footer)
      UiButton(variant="secondary", @click="showModal = false") Отмена
      UiButton(
        variant="primary",
        :disabled="isSubmitDisabled",
        @click="saveTemplate"
      )
        | {{ submitButtonText }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { Mail, Edit, Copy, Plus, Trash2, Eye } from 'lucide-vue-next'
import { useTemplatesStore } from '~/stores/templates.store'
import { RECIPIENT_LABELS } from '~/types/template.types'
import type { Template, TemplateRecipient } from '~/types/template.types'
import {
  interpolateTemplate,
  extractTemplateVariables,
  AVAILABLE_TEMPLATE_TAGS,
} from '~/utils/template'

const templatesStore = useTemplatesStore()
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const isSubmitting = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const formData = reactive({
  title: '',
  body: '',
  recipient: 'candidate' as TemplateRecipient,
})

const recipientOptions = [
  { value: 'candidate', label: 'Кандидат (соискатель)' },
  { value: 'director', label: 'Директор филиала' },
  { value: 'regional_manager', label: 'РМП' },
]

const sampleContext: Record<string, string> = {
  'Имя': 'Иван',
  'имя': 'Иван',
  'ФИО': 'Петров Иван Сергеевич',
  'ФИО кандидата': 'Петров Иван Сергеевич',
  'Вакансия': 'Старший кассир',
  'вакансия': 'Старший кассир',
  'ДатаИнтервью': '10 октября 2026 в 14:00',
  'дата': '10.10.2026',
  'время': '14:00',
  'АдресИнтервью': 'г. Москва, ул. Ленина, д. 10',
  'адрес': 'г. Москва, ул. Ленина, д. 10',
  'ТелефонРекрутера': '+7 (900) 123-45-67',
  'телефон': '+7 (900) 123-45-67',
  'ОргЕдиница': 'Пятёрочка №6702, Москва',
  'орг.единица': 'Пятёрочка №6702, Москва',
}

onMounted(async () => {
  await templatesStore.fetchByType('sms')
})

const getRecipientTitle = (r: TemplateRecipient) => {
  return RECIPIENT_LABELS[r] || r || 'Кандидат'
}

const getTemplateTags = (text: string): string[] => {
  return extractTemplateVariables(text)
}

const formatTag = (tag: string): string => {
  return tag.startsWith('{') ? tag : `{${tag}}`
}

const renderPreview = (templateBody: string): string => {
  if (!templateBody) return ''
  return interpolateTemplate(templateBody, sampleContext)
}

const livePreviewModalText = computed(() => {
  return renderPreview(formData.body) || 'Введите текст с переменными выше...'
})

const isSubmitDisabled = computed(() => {
  return !formData.title.trim() || !formData.body.trim() || isSubmitting.value
})

const submitButtonText = computed(() => {
  if (isSubmitting.value) return 'Сохранение...'
  return isEditing.value ? 'Сохранить изменения' : 'Создать шаблон'
})

const openCreate = () => {
  isEditing.value = false
  editingId.value = null
  formData.title = ''
  formData.body = 'Здравствуйте, {Имя}! Приглашаем вас на собеседование на вакансию «{Вакансия}» {ДатаИнтервью} по адресу: {АдресИнтервью}. По всем вопросам: {ТелефонРекрутера}. Ждём вас!'
  formData.recipient = 'candidate'
  showModal.value = true
}

const openEdit = (tmpl: Template) => {
  isEditing.value = true
  editingId.value = tmpl.id
  formData.title = tmpl.title
  formData.body = tmpl.body
  formData.recipient = tmpl.recipient
  showModal.value = true
}

const insertTag = (tag: string) => {
  if (!textareaRef.value) {
    formData.body += tag
    return
  }
  const el = textareaRef.value
  const start = el.selectionStart || formData.body.length
  const end = el.selectionEnd || formData.body.length
  const text = formData.body
  formData.body = text.substring(0, start) + tag + text.substring(end)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(start + tag.length, start + tag.length)
  })
}

const saveTemplate = async () => {
  if (!formData.title.trim() || !formData.body.trim()) return
  isSubmitting.value = true
  try {
    if (isEditing.value && editingId.value) {
      await templatesStore.update(editingId.value, {
        title: formData.title.trim(),
        body: formData.body.trim(),
        recipient: formData.recipient,
      })
    } else {
      await templatesStore.create({
        type: 'sms',
        title: formData.title.trim(),
        body: formData.body.trim(),
        recipient: formData.recipient,
      })
    }
    showModal.value = false
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async (id: string) => {
  if (confirm('Вы действительно хотите удалить этот шаблон?')) {
    await templatesStore.deleteTemplate(id)
  }
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch { /* ignored */ }
}
</script>

<style lang="scss">
.page-templates {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-6);
  }
  
  &__list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.template-card {
  padding: 18px 22px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--color-primary);
  }
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  
  &__badge {
    padding: 2px 10px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 600;
    background-color: rgba(59, 130, 246, 0.1);
    color: var(--color-primary);
  }

  &__tags {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    flex-wrap: wrap;

    &-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    &-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
  }

  &__tag {
    font-size: 11px;
    font-family: monospace;
    font-weight: 600;
    padding: 1px 6px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-primary);
  }
  
  &__body {
    font-size: 14px;
    color: var(--color-text-primary);
    line-height: 1.6;
    margin-bottom: 12px;
    background-color: var(--color-bg-body);
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
  }

  &__preview-box {
    margin-bottom: 14px;
    padding: 10px 14px;
    background-color: rgba(16, 185, 129, 0.05);
    border: 1px dashed rgba(16, 185, 129, 0.3);
    border-radius: var(--radius-sm);
  }

  &__preview-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: #10b981;
    display: block;
    margin-bottom: 4px;
  }

  &__preview-text {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
  }
  
  &__actions {
    display: flex;
    gap: 8px;
  }
}

.template-form {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 12px;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  &__tags {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);

    &-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    &-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    &-hint {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    &-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    &-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      background-color: var(--color-bg-card);
      border: 1px solid var(--color-border);
      font-size: 11px;
      color: var(--color-primary);
      cursor: pointer;
      transition: all 0.15s;

      strong {
        font-family: monospace;
      }

      &:hover {
        background-color: rgba(59, 130, 246, 0.1);
        border-color: var(--color-primary);
      }
    }

    &-desc {
      color: var(--color-text-muted);
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

  &__live-preview {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    background-color: rgba(59, 130, 246, 0.04);
    border: 1px dashed rgba(59, 130, 246, 0.3);
    border-radius: var(--radius-md);
  }

  &__preview-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-primary);
  }

  &__preview-bubble {
    font-size: 13px;
    line-height: 1.5;
    color: var(--color-text-primary);
  }
}
</style>
