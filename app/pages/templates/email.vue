<template lang="pug">
.page-templates
  .page-templates__header
    h1.page-title Шаблоны Email
  .page-vacancies__loading(v-if="templatesStore.isLoading")
    .page-candidates__spinner
  .page-vacancies__empty(v-else-if="templatesStore.templates.length === 0")
    p Email-шаблоны не найдены
  .page-templates__list(v-else)
    .template-card(v-for="tmpl in templatesStore.templates", :key="tmpl.id")
      .template-card__header
        h3.template-card__title {{ tmpl.title }}
        .template-card__badge {{ RECIPIENT_LABELS[tmpl.recipient] || tmpl.recipient }}
      p.template-card__body {{ tmpl.body }}
      .template-card__actions
        UiButton(variant="ghost", size="sm", @click="openEdit(tmpl)")
          | Редактировать
        UiButton(variant="ghost", size="sm", @click="navigator.clipboard.writeText(tmpl.body)")
          | Копировать
  UiModal(v-model="showEdit", title="Редактировать", size="md")
    .vacancy-form(v-if="editing")
      UiInput(v-model="editing.title", label="Название")
      .candidate-add-form__comment
        label.candidate-add-form__label Текст
        textarea.candidate-add-form__textarea(v-model="editing.body")
    template(#footer)
      UiButton(variant="secondary", @click="showEdit = false") Отмена
      UiButton(variant="primary", @click="saveEdit") Сохранить
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTemplatesStore } from '~/stores/templates.store'
import { RECIPIENT_LABELS } from '~/types/template.types'
import type { Template } from '~/types/template.types'

const templatesStore = useTemplatesStore()
const showEdit = ref(false)
const editing = ref<{ id: string; title: string; body: string } | null>(null)

onMounted(() => templatesStore.fetchByType('email'))

const openEdit = (t: Template) => {
  editing.value = { id: t.id, title: t.title, body: t.body }
  showEdit.value = true
}
const saveEdit = async () => {
  if (!editing.value) return
  await templatesStore.update(editing.value.id, { title: editing.value.title, body: editing.value.body })
  showEdit.value = false
}
</script>
