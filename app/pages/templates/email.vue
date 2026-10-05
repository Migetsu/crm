<template lang="pug">
.page-templates
  .page-templates__header
    div
      h1.page-title Шаблоны Email
      p.page-subtitle Управление письмами для соискателей, директоров и руководителей
    UiButton(variant="primary", @click="openCreate")
      template(#icon)
        Plus(:size="18")
      | Добавить шаблон
      
  .page-templates__list(v-if="templatesStore.isLoading && !templatesStore.templates.length", aria-hidden="true")
    .template-card(v-for="i in 3", :key="i", style="pointer-events: none;")
      .template-card__header
        .template-card__title-row(style="display: flex; gap: 12px; width: 60%;")
          UiSkeleton(width="180px", height="20px")
          UiSkeleton(width="90px", height="18px")
        .template-card__actions(style="display: flex; gap: 8px;")
          UiSkeleton(width="100px", height="30px")
          UiSkeleton(width="80px", height="30px")
          UiSkeleton(width="30px", height="30px")
      .template-card__tags(style="display: flex; gap: 6px; margin: 12px 0;")
        UiSkeleton(width="70px", height="18px")
        UiSkeleton(width="70px", height="18px")
      UiSkeleton(width="100%", height="40px")
    
  .page-vacancies__empty(v-else-if="templatesStore.templates.length === 0")
    Mail(:size="48")
    p Email-шаблоны не найдены
    
  .page-templates__list(v-else)
    .template-card(v-for="tmpl in templatesStore.templates", :key="tmpl.id")
      .template-card__header
        .template-card__title-row
          h3.template-card__title {{ tmpl.title }}
          .template-card__badge {{ recipientLabel(tmpl.recipient) }}
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

      p.template-card__body.template-card__body--email {{ tmpl.body }}

      //- Live sample preview toggle
      .template-card__preview-box
        span.template-card__preview-label Пример с подстановкой:
        pre.template-card__preview-text {{ renderPreview(tmpl.body) }}

  //- Edit / Create Modal
  UiModal(
    v-model="showModal",
    :title="isEditing ? 'Редактировать шаблон Email' : 'Новый шаблон Email'",
    size="lg"
  )
    .template-form
      .template-form__grid
        UiInput(
          v-model="formData.title",
          label="Тема / Название шаблона *",
          placeholder="Например, Приглашение на собеседование"
        )
        UiSelect(
          v-model="formData.recipient",
          label="Получатель *",
          :options="recipientOptions"
        )

      .template-form__tags
        .template-form__tags-header
          span.template-form__tags-title Доступные переменные (клик для вставки):
          span.template-form__tags-hint Вставляются в текст письма
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
        label.template-form__label Тело письма *
        textarea.template-form__textarea(
          ref="textareaRef",
          v-model="formData.body",
          rows="7",
          placeholder="Здравствуйте, {Имя}!\n\nПриглашаем вас на вакансию {Вакансия}..."
        )

      //- Live Preview inside Modal
      .template-form__live-preview
        .template-form__preview-header
          Eye(:size="14")
          span Предпросмотр с тестовыми данными:
        pre.template-form__preview-bubble
          | {{ renderPreview(formData.body) || 'Введите текст с переменными выше...' }}

    template(#footer)
      UiButton(variant="secondary", @click="showModal = false") Отмена
      UiButton(
        variant="primary",
        :disabled="!formData.title.trim() || !formData.body.trim() || isSubmitting",
        @click="saveTemplate"
      )
        | {{ isSubmitting ? 'Сохранение...' : (isEditing ? 'Сохранить изменения' : 'Создать шаблон') }}
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import { Mail, Edit, Copy, Plus, Trash2, Eye } from 'lucide-vue-next'
import { useTemplatesStore } from '~/stores/templates.store'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'
import UiSkeleton from '~/components/ui/UiSkeleton/UiSkeleton.vue'
import { RECIPIENT_LABELS } from '~/types/template.types'
import type { Template, TemplateRecipient } from '~/types/template.types'
import {
  interpolateTemplate,
  extractTemplateVariables,
  AVAILABLE_TEMPLATE_TAGS,
} from '~/utils/template'

const templatesStore = useTemplatesStore()
const toast = useToast()
const confirm = useConfirm()
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

// Mock preview context
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
  await templatesStore.fetchByType('email')
})

const recipientLabel = (r: TemplateRecipient) => RECIPIENT_LABELS[r] || r

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

const openCreate = () => {
  isEditing.value = false
  editingId.value = null
  formData.title = ''
  formData.body = `Здравствуйте, {Имя}!

Приглашаем вас на собеседование на позицию «{Вакансия}».

Дата и время: {ДатаИнтервью}
Адрес: {АдресИнтервью}
Подразделение: {ОргЕдиница}

Пожалуйста, возьмите с собой паспорт и документ об образовании.
Если у вас возникнут вопросы, вы можете связаться с нами по телефону: {ТелефонРекрутера}.

С уважением,
Отдел подбора персонала`
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
      toast.success('Шаблон Email успешно обновлен')
    } else {
      await templatesStore.create({
        type: 'email',
        title: formData.title.trim(),
        body: formData.body.trim(),
        recipient: formData.recipient,
      })
      toast.success('Шаблон Email успешно создан')
    }
    showModal.value = false
  } catch (err: unknown) {
    toast.error('Не удалось сохранить шаблон Email')
    console.error(err)
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async (id: string) => {
  const confirmed = await confirm.confirm({
    title: 'Удаление шаблона',
    message: 'Вы уверены, что хотите удалить этот email-шаблон? Это действие нельзя отменить.',
    confirmText: 'Удалить шаблон',
    cancelText: 'Отмена',
    variant: 'danger',
    icon: 'trash',
  })
  if (!confirmed) return

  try {
    const success = await templatesStore.deleteTemplate(id)
    if (success) {
      toast.success('Шаблон Email успешно удален')
    } else {
      toast.error('Не удалось удалить шаблон')
    }
  } catch (err: unknown) {
    toast.error('Ошибка при удалении шаблона')
    console.error(err)
  }
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.info('Текст скопирован в буфер обмена')
  } catch { /* ignored */ }
}
</script>

<style lang="scss">
.template-card__body--email {
  white-space: pre-line;
}

.template-card__preview-text,
.template-form__preview-bubble {
  white-space: pre-line;
  font-family: inherit;
}
</style>
