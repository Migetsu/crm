<template lang="pug">
.page-templates
  .page-templates__header
    h1.page-title Шаблоны SMS
    
  .page-vacancies__loading(v-if="templatesStore.isLoading")
    .page-candidates__spinner
    | Загрузка...
    
  .page-vacancies__empty(v-else-if="templatesStore.templates.length === 0")
    Mail(:size="48")
    p SMS-шаблоны не найдены
    
  .page-templates__list(v-else)
    .template-card(v-for="tmpl in templatesStore.templates", :key="tmpl.id")
      .template-card__header
        h3.template-card__title {{ tmpl.title }}
        .template-card__badge {{ recipientLabel(tmpl.recipient) }}
      p.template-card__body {{ tmpl.body }}
      .template-card__actions
        UiButton(variant="ghost", size="sm", @click="openEdit(tmpl)")
          template(#icon)
            Edit(:size="14")
          | Редактировать
        UiButton(variant="ghost", size="sm", @click="copyText(tmpl.body)")
          template(#icon)
            Copy(:size="14")
          | Копировать

  //- Edit modal
  UiModal(v-model="showEditModal", title="Редактировать шаблон", size="md")
    .vacancy-form(v-if="editingTemplate")
      UiInput(v-model="editingTemplate.title", label="Название")
      .candidate-add-form__comment
        label.candidate-add-form__label Текст шаблона
        textarea.candidate-add-form__textarea(v-model="editingTemplate.body", rows="6")
    template(#footer)
      UiButton(variant="secondary", @click="showEditModal = false") Отмена
      UiButton(variant="primary", @click="saveEdit") Сохранить
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Mail, Edit, Copy } from 'lucide-vue-next'
import { useTemplatesStore } from '~/stores/templates.store'
import { RECIPIENT_LABELS } from '~/types/template.types'
import type { Template, TemplateRecipient } from '~/types/template.types'

const templatesStore = useTemplatesStore()
const showEditModal = ref(false)
const editingTemplate = ref<{ id: string; title: string; body: string } | null>(null)

onMounted(async () => {
  await templatesStore.fetchByType('sms')
})

const recipientLabel = (r: TemplateRecipient) => RECIPIENT_LABELS[r] || r

const openEdit = (tmpl: Template) => {
  editingTemplate.value = { id: tmpl.id, title: tmpl.title, body: tmpl.body }
  showEditModal.value = true
}

const saveEdit = async () => {
  if (!editingTemplate.value) return
  await templatesStore.update(editingTemplate.value.id, {
    title: editingTemplate.value.title,
    body: editingTemplate.value.body,
  })
  showEditModal.value = false
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch { /* fallback not needed for MVP */ }
}
</script>

<style lang="scss">
.page-templates {
  &__header {
    margin-bottom: var(--spacing-6);
  }
  
  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.template-card {
  padding: 16px 20px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  &__title {
    font-size: 15px;
    font-weight: 600;
  }
  
  &__badge {
    padding: 2px 10px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 600;
    background-color: rgba(59, 130, 246, 0.1);
    color: var(--color-primary);
  }
  
  &__body {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin-bottom: 12px;
  }
  
  &__actions {
    display: flex;
    gap: 8px;
  }
}
</style>
