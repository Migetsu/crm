<template lang="pug">
UiModal(v-model="isOpen", title="Звонок кандидату", size="md")
  .call-modal(v-if="candidate")
    .call-modal__info
      .call-modal__phone-badge
        Phone(:size="18")
        a.call-modal__phone-link(:href="`tel:${candidate.phone}`") {{ candidate.phone }}
      p.call-modal__hint Нажмите на номер выше для вызова, затем зафиксируйте итог разговора.

    UiRadioGroup(
      v-model="callResult",
      label="Результат звонка *",
      name="call_result",
      :options="callResultOptions"
    )

    .call-modal__field
      label.call-modal__label Заметка по итогам разговора
      textarea.call-modal__textarea(
        v-model="callNotes",
        placeholder="О чем договорились, готовность выйти на работу, пожелания по графику..."
      )

  template(#footer)
    UiButton(variant="secondary", @click="isOpen = false") Отмена
    UiButton(variant="primary", :disabled="!callResult || isSubmitting", @click="handleSave")
      | {{ isSubmitting ? 'Сохранение...' : 'Зафиксировать звонок' }}
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Phone } from 'lucide-vue-next'
import { HistoryService } from '~/services/history.service'
import type { Candidate } from '~/types/candidate.types'

const props = defineProps<{
  candidate: Candidate | null
}>()

const emit = defineEmits<{
  (e: 'logged'): void
}>()

const isOpen = defineModel<boolean>()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const historyService = new HistoryService(supabase)

const callResult = ref('connected')
const callNotes = ref('')
const isSubmitting = ref(false)

const callResultOptions = [
  { value: 'connected', label: 'Разговор состоялся' },
  { value: 'no_answer', label: 'Не отвечает / Сброс' },
  { value: 'busy', label: 'Занято' },
  { value: 'wrong_number', label: 'Неверный номер' },
  { value: 'other', label: 'Другое' },
]

const resultLabels: Record<string, string> = {
  connected: 'Разговор состоялся',
  no_answer: 'Не отвечает / Сброс',
  busy: 'Занято',
  wrong_number: 'Неверный номер',
  other: 'Другое',
}

const handleSave = async () => {
  if (!props.candidate || !callResult.value) return

  isSubmitting.value = true
  try {
    const title = `Исходящий звонок: ${resultLabels[callResult.value] || callResult.value}`
    await historyService.create({
      candidate_id: props.candidate.id,
      type: 'call',
      title,
      body: callNotes.value.trim() || null,
      created_by: user.value?.id || null,
      meta: {
        phone: props.candidate.phone,
        call_result: callResult.value as 'connected' | 'no_answer' | 'busy' | 'wrong_number' | 'other',
      },
    })

    isOpen.value = false
    emit('logged')
    toast.success('Результат звонка сохранён в истории')
  } catch (err: unknown) {
    toast.error('Не удалось сохранить информацию о звонке')
    console.error(err)
  } finally {
    isSubmitting.value = false
  }
}

watch(isOpen, (val) => {
  if (val) {
    callResult.value = 'connected'
    callNotes.value = ''
  }
})
</script>

<style lang="scss">
.call-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  &__phone-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-primary);
  }

  &__phone-link {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__hint {
    font-size: 13px;
    color: var(--color-text-secondary);
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
    min-height: 90px;
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
