<template lang="pug">
UiModal(v-model="isOpen", title="Добавить кандидата", size="lg")
  form.candidate-add-form(@submit.prevent="handleSubmit")
    .candidate-add-form__grid
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
      
      .candidate-add-form__middle-name
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
      UiInput(v-model="form.resume_link", label="Ссылка на резюме", placeholder="https://...")
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
      
    .candidate-add-form__comment
      label.candidate-add-form__label Комментарий
      textarea.candidate-add-form__textarea(v-model="comment", placeholder="Оставьте комментарий...")
  
  template(#footer)
    UiButton(variant="secondary", @click="isOpen = false") Отмена
    UiButton(variant="primary", @click="handleSubmit", :disabled="isSubmitting")
      | {{ isSubmitting ? 'Сохранение...' : 'Сохранить' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCandidatesStore } from '~/stores/candidates.store'
import { useVacanciesStore } from '~/stores/vacancies.store'
import { HistoryService } from '~/services/history.service'
import { CITIZENSHIP_LABELS, GENDER_LABELS, SOURCE_LABELS, ADD_METHOD_LABELS } from '~/types/candidate.types'
import type { CandidateCreatePayload, Citizenship, CandidateGender, CandidateSource, CandidateAddMethod } from '~/types/candidate.types'

const isOpen = defineModel<boolean>()
const router = useRouter()
const candidatesStore = useCandidatesStore()
const vacanciesStore = useVacanciesStore()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const historyService = new HistoryService(supabase)

const isSubmitting = ref(false)
const comment = ref('')

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

const vacancyOptions = computed(() => {
  return vacanciesStore.vacancies
    .filter(v => v.is_open)
    .map(v => ({ value: v.id, label: v.title }))
})

const genderOptions = Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))
const citizenshipOptions = Object.entries(CITIZENSHIP_LABELS).map(([value, label]) => ({ value, label }))
const sourceOptions = Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))
const addMethodOptions = Object.entries(ADD_METHOD_LABELS).map(([value, label]) => ({ value, label }))

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
  if (!validate()) return
  
  isSubmitting.value = true
  try {
    const payload: CandidateCreatePayload = {
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
      resume_link: form.resume_link.trim() || null,
      address: form.address.trim() || null,
      citizenship: form.citizenship as Citizenship,
      source: form.source as CandidateSource,
      add_method: form.add_method as CandidateAddMethod,
      created_by: user.value?.id,
    }
    
    const candidate = await candidatesStore.create(payload)
    if (candidate) {
      // Record status_change event
      await historyService.create({
        candidate_id: candidate.id,
        type: 'status_change',
        title: 'Кандидат создан',
        body: comment.value.trim() || null,
        created_by: user.value?.id || null,
        meta: { status: 'new' },
      })
      
      isOpen.value = false
      router.push(`/candidates/${candidate.id}`)
    }
  } finally {
    isSubmitting.value = false
  }
}

// Reset form when modal opens
watch(isOpen, (val) => {
  if (val) {
    errors.value = {}
    form.vacancy_id = ''
    form.last_name = ''
    form.first_name = ''
    form.middle_name = ''
    form.has_no_middle_name = false
    form.birth_date = ''
    form.recommended_by = ''
    form.gender = ''
    form.phone = ''
    form.email = ''
    form.resume_link = ''
    form.address = ''
    form.citizenship = ''
    form.source = ''
    form.add_method = 'manual'
    comment.value = ''
  }
})
</script>

<style lang="scss">
.candidate-add-form {
  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  &__middle-name {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  &__comment {
    margin-top: 20px;
    grid-column: 1 / -1;
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
