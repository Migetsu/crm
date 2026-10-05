<template lang="pug">
UiModal(v-model="isOpen", :title="modalTitle", size="lg")
  form.candidate-edit-form(@submit.prevent="handleSubmit")
    .candidate-edit-form__grid
      UiSelect(
        v-model="form.vacancy_id",
        label="Вакансия *",
        placeholder="Выберите вакансию",
        :options="vacancyOptions",
        :error="errors.vacancy_id",
        searchable
      )
      
      UiInput(
        v-model="form.last_name",
        label="Фамилия *",
        placeholder="Иванов",
        :error="errors.last_name"
      )
      
      UiInput(
        v-model="form.first_name",
        label="Имя *",
        placeholder="Анна",
        :error="errors.first_name"
      )
      
      .candidate-edit-form__middle-name
        UiInput(
          v-model="form.middle_name",
          label="Отчество *",
          placeholder="Петровна",
          :error="errors.middle_name",
          :disabled="form.has_no_middle_name"
        )
        UiCheckbox(v-model="form.has_no_middle_name", label="Нет отчества")
        
      UiInput(
        v-model="form.birth_date",
        label="Дата рождения *",
        type="date",
        :error="errors.birth_date"
      )
      
      UiInput(v-model="form.recommended_by", label="Рекомендация от", placeholder="ФИО рекомендателя")
      
      UiRadioGroup(
        v-model="form.gender",
        label="Пол *",
        name="gender",
        :options="genderOptions",
        :error="errors.gender"
      )
      
      UiInput(
        v-model="form.phone",
        label="Телефон *",
        type="tel",
        placeholder="+7 900 000 00 00",
        :error="errors.phone"
      )
      
      UiInput(v-model="form.email", label="Почта", type="email", placeholder="email@example.com")

      .candidate-edit-form__resume-field
        UiFileUpload(
          label="Заменить резюме (PDF, DOCX, DOC)",
          @file-selected="file => resumeFile = file"
        )
        UiInput(v-model="form.resume_link", label="Ссылка на резюме", placeholder="https://...")
        span.candidate-edit-form__resume-hint(v-if="candidate?.resume_link && !resumeFile")
          | Текущий файл/ссылка: 
          a(:href="candidate.resume_link", target="_blank", rel="noopener noreferrer") {{ currentResumeName }}

      UiInput(v-model="form.address", label="Адрес", placeholder="Город, улица")
      
      UiSelect(
        v-model="form.citizenship",
        label="Гражданство *",
        placeholder="Выберите гражданство",
        :options="citizenshipOptions",
        :error="errors.citizenship",
        searchable
      )
      
      UiRadioGroup(
        v-model="form.source",
        label="Источник *",
        name="source",
        :options="sourceOptions",
        :error="errors.source"
      )
      
      UiRadioGroup(
        v-model="form.add_method",
        label="Способ добавления *",
        name="add_method",
        :options="addMethodOptions",
        :error="errors.add_method"
      )
      
    .candidate-edit-form__comment
      label.candidate-edit-form__label Причина или комментарий к изменениям
      textarea.candidate-edit-form__textarea(v-model="comment", placeholder="Опишите внесенные изменения (необязательно)...")
  
  template(#footer)
    UiButton(variant="secondary", @click="isOpen = false") Отмена
    UiButton(variant="primary", @click="handleSubmit", :disabled="isSubmitting")
      | {{ isSubmitting ? 'Сохранение...' : 'Применить изменения' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useCandidatesStore } from '~/stores/candidates.store'
import { useVacanciesStore } from '~/stores/vacancies.store'
import { HistoryService } from '~/services/history.service'
import { StorageService } from '~/services/storage.service'
import { CITIZENSHIP_LABELS, GENDER_LABELS, SOURCE_LABELS, ADD_METHOD_LABELS } from '~/types/candidate.types'
import type { Candidate, Citizenship, CandidateGender, CandidateSource, CandidateAddMethod } from '~/types/candidate.types'
import { useToast } from '~/composables/useToast'
import UiModal from '~/components/ui/UiModal/UiModal.vue'
import UiButton from '~/components/ui/UiButton/UiButton.vue'
import UiInput from '~/components/ui/UiInput/UiInput.vue'
import UiSelect from '~/components/ui/UiSelect/UiSelect.vue'
import UiCheckbox from '~/components/ui/UiCheckbox/UiCheckbox.vue'
import UiRadioGroup from '~/components/ui/UiRadioGroup/UiRadioGroup.vue'
import UiFileUpload from '~/components/ui/UiFileUpload/UiFileUpload.vue'

const props = defineProps<{
  candidate: Candidate | null
}>()

const isOpen = defineModel<boolean>()
const emit = defineEmits<{
  (e: 'updated', candidate: Candidate): void
}>()

const candidatesStore = useCandidatesStore()
const vacanciesStore = useVacanciesStore()
const toast = useToast()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const historyService = new HistoryService(supabase)
const storageService = new StorageService(supabase)

const isSubmitting = ref(false)
const comment = ref('')
const resumeFile = ref<File | null>(null)

const form = reactive({
  vacancy_id: '',
  last_name: '',
  first_name: '',
  middle_name: '',
  has_no_middle_name: false,
  birth_date: '',
  recommended_by: '',
  gender: '' as string,
  phone: '',
  email: '',
  resume_link: '',
  address: '',
  citizenship: '' as string,
  source: '' as string,
  add_method: 'manual' as string,
})

const errors = ref<Record<string, string>>({})

const modalTitle = computed(() => {
  if (!props.candidate) return 'Редактировать кандидата'
  const name = [form.last_name, form.first_name].filter(Boolean).join(' ')
  return name ? `Редактирование: ${name}` : 'Редактировать кандидата'
})

const currentResumeName = computed(() => {
  if (!props.candidate?.resume_link) return ''
  const parts = props.candidate.resume_link.split('/')
  const raw = parts[parts.length - 1] || 'Резюме'
  return decodeURIComponent(raw).replace(/^\d+_/, '')
})

const vacancyOptions = computed(() => {
  const options = vacanciesStore.vacancies
    .map(v => ({ value: v.id, label: `${v.title}${v.is_open ? '' : ' (закрыта)'}` }))

  // Ensure current candidate's vacancy is in list even if not yet fetched
  if (props.candidate?.vacancy_id && !options.some(o => o.value === props.candidate?.vacancy_id)) {
    options.unshift({
      value: props.candidate.vacancy_id,
      label: props.candidate.vacancies?.title || 'Текущая вакансия',
    })
  }
  return options
})

const genderOptions = Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))
const citizenshipOptions = Object.entries(CITIZENSHIP_LABELS).map(([value, label]) => ({ value, label }))
const sourceOptions = Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))
const addMethodOptions = Object.entries(ADD_METHOD_LABELS).map(([value, label]) => ({ value, label }))

const populateForm = () => {
  if (!props.candidate) return
  const c = props.candidate
  form.vacancy_id = c.vacancy_id || ''
  form.last_name = c.last_name || ''
  form.first_name = c.first_name || ''
  form.middle_name = c.middle_name || ''
  form.has_no_middle_name = c.has_no_middle_name || !c.middle_name
  form.birth_date = c.birth_date ? c.birth_date.slice(0, 10) : ''
  form.recommended_by = c.recommended_by || ''
  form.gender = c.gender || ''
  form.phone = c.phone || ''
  form.email = c.email || ''
  form.resume_link = c.resume_link || ''
  form.address = c.address || ''
  form.citizenship = c.citizenship || ''
  form.source = c.source || ''
  form.add_method = c.add_method || 'manual'
  comment.value = ''
  resumeFile.value = null
  errors.value = {}
}

watch(() => props.candidate, () => {
  if (isOpen.value) populateForm()
}, { immediate: true })

watch(isOpen, (open) => {
  if (open) populateForm()
})

onMounted(async () => {
  await vacanciesStore.fetchAll()
})

const validate = (): boolean => {
  const newErrors: Record<string, string> = {}
  
  if (!form.vacancy_id) newErrors.vacancy_id = 'Выберите вакансию'
  if (!form.last_name.trim()) newErrors.last_name = 'Введите фамилию'
  if (!form.first_name.trim()) newErrors.first_name = 'Введите имя'
  if (!form.has_no_middle_name && !form.middle_name.trim()) newErrors.middle_name = 'Введите отчество'
  if (!form.birth_date) newErrors.birth_date = 'Укажите дату рождения'
  if (!form.gender) newErrors.gender = 'Выберите пол'
  if (!form.phone.trim()) newErrors.phone = 'Введите телефон'
  if (!form.citizenship) newErrors.citizenship = 'Выберите гражданство'
  if (!form.source) newErrors.source = 'Выберите источник'
  if (!form.add_method) newErrors.add_method = 'Выберите способ'
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async () => {
  if (!props.candidate) return
  if (!validate()) return
  
  isSubmitting.value = true
  try {
    let finalResumeLink = form.resume_link.trim() || null

    if (resumeFile.value) {
      try {
        const uploadRes = await storageService.uploadResume(props.candidate.id, resumeFile.value)
        finalResumeLink = uploadRes.url
        await historyService.create({
          candidate_id: props.candidate.id,
          type: 'attachment',
          title: `Загружено новое резюме: ${uploadRes.name}`,
          body: null,
          created_by: user.value?.id || null,
          meta: {
            file_name: uploadRes.name,
            file_url: uploadRes.url,
            file_size: uploadRes.size,
          },
        })
      } catch (uploadErr) {
        console.error('Failed to upload new resume:', uploadErr)
      }
    }

    const updatePayload: Partial<Candidate> = {
      vacancy_id: form.vacancy_id,
      last_name: form.last_name.trim(),
      first_name: form.first_name.trim(),
      middle_name: form.has_no_middle_name ? null : form.middle_name.trim() || null,
      has_no_middle_name: form.has_no_middle_name,
      birth_date: form.birth_date,
      recommended_by: form.recommended_by.trim() || null,
      gender: form.gender as CandidateGender,
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      resume_link: finalResumeLink,
      address: form.address.trim() || null,
      citizenship: form.citizenship as Citizenship,
      source: form.source as CandidateSource,
      add_method: form.add_method as CandidateAddMethod,
    }
    
    const success = await candidatesStore.update(props.candidate.id, updatePayload)
    if (success) {
      const updatedCandidate = { ...props.candidate, ...updatePayload } as Candidate

      // Record edit event in candidate history
      await historyService.create({
        candidate_id: props.candidate.id,
        type: 'note',
        title: 'Данные кандидата обновлены',
        body: comment.value.trim() ? `Комментарий: ${comment.value.trim()}` : null,
        created_by: user.value?.id || null,
        meta: {
          updated_fields: Object.keys(updatePayload),
        },
      })
      
      isOpen.value = false
      emit('updated', updatedCandidate)
      toast.success('Данные кандидата успешно сохранены')
    } else {
      toast.error('Не удалось сохранить изменения')
    }
  } catch (err: unknown) {
    toast.error('Произошла ошибка при сохранении изменений')
    console.error(err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style lang="scss">
@use '~/assets/scss/variables' as *;

.candidate-edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
  
  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-4);
    
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
  
  &__middle-name {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }
  
  &__resume-field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  &__resume-hint {
    font-size: 12px;
    color: var(--color-text-muted);

    a {
      color: var(--color-primary);
      text-decoration: underline;

      &:hover {
        opacity: 0.8;
      }
    }
  }
  
  &__comment {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }
  
  &__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  
  &__textarea {
    width: 100%;
    height: 80px;
    padding: var(--spacing-3);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background-color: var(--color-bg-body);
    color: var(--color-text-primary);
    font-size: 14px;
    resize: vertical;
    font-family: inherit;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
    
    &::placeholder {
      color: var(--color-text-muted);
    }
  }
}
</style>
